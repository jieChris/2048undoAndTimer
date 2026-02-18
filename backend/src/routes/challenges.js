import { pool } from "../db.js";
import { getModeByKey, listModes } from "../modes/catalog.js";

function parsePositiveInt(value, fallback, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  if (typeof max === "number" && n > max) return max;
  return n;
}

function utcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function deterministicSeed(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function pickDailyModeKey(dateStr) {
  const candidates = listModes()
    .filter((m) => m.rank_policy !== "seasonal" && m.key !== "practice_legacy")
    .map((m) => m.key)
    .sort();

  const fallback = "standard_4x4_pow2_no_undo";
  if (!candidates.length) return fallback;

  let hash = 0;
  for (let i = 0; i < dateStr.length; i += 1) {
    hash = (hash * 33 + dateStr.charCodeAt(i)) >>> 0;
  }
  return candidates[hash % candidates.length] || fallback;
}

async function ensureDailyChallenge() {
  const dateStr = utcDateString();

  const existing = await pool.query(
    `
      SELECT id, challenge_date, mode_key, seed, status, title, special_rules_snapshot
      FROM challenges
      WHERE challenge_date = ?
      LIMIT 1
    `,
    [dateStr]
  );

  if (existing.rows.length) {
    return existing.rows[0];
  }

  const modeKey = pickDailyModeKey(dateStr);
  const mode = getModeByKey(modeKey);
  const seed = deterministicSeed(`daily:${dateStr}:${modeKey}`);
  const id = `daily_${dateStr.replace(/-/g, "")}`;
  const title = `每日挑战 ${dateStr}`;

  try {
    await pool.query(
      `
        INSERT INTO challenges (
          id, challenge_date, mode_key, seed, status, title, special_rules_snapshot
        ) VALUES (?, ?, ?, ?, 'active', ?, ?)
      `,
      [
        id,
        dateStr,
        modeKey,
        seed,
        title,
        JSON.stringify((mode && mode.special_rules) || {})
      ]
    );
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      const retry = await pool.query(
        `
          SELECT id, challenge_date, mode_key, seed, status, title, special_rules_snapshot
          FROM challenges
          WHERE challenge_date = ?
          LIMIT 1
        `,
        [dateStr]
      );
      if (retry.rows.length) return retry.rows[0];
    }
    throw error;
  }

  return {
    id,
    challenge_date: dateStr,
    mode_key: modeKey,
    seed,
    status: "active",
    title,
    special_rules_snapshot: JSON.stringify((mode && mode.special_rules) || {})
  };
}

function parseJsonValue(value) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_err) {
      return null;
    }
  }
  return null;
}

function toDateString(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export async function challengeRoutes(fastify) {
  fastify.get("/challenges/daily", async (_request, _reply) => {
    const challenge = await ensureDailyChallenge();
    const mode = getModeByKey(challenge.mode_key);

    return {
      id: challenge.id,
      challenge_date: toDateString(challenge.challenge_date),
      mode_key: challenge.mode_key,
      mode_label: mode ? mode.label : challenge.mode_key,
      seed: Number(challenge.seed),
      status: challenge.status,
      title: challenge.title,
      special_rules_snapshot: parseJsonValue(challenge.special_rules_snapshot) || {}
    };
  });

  fastify.get("/challenges/:id/leaderboard", async (request, reply) => {
    const { id } = request.params;
    const limit = parsePositiveInt(request.query.limit, 50, 100);
    const offset = parsePositiveInt(request.query.offset, 0, 10_000);

    const challengeResult = await pool.query(
      `
        SELECT id, challenge_date, mode_key, status, title
        FROM challenges
        WHERE id = ?
      `,
      [id]
    );

    if (!challengeResult.rows.length) {
      return reply.code(404).send({ error: "challenge_not_found" });
    }

    const challenge = challengeResult.rows[0];

    const result = await pool.query(
      `
        SELECT
          u.username,
          gs.score,
          gs.best_tile,
          gs.duration_ms,
          gs.ended_at,
          gs.id AS session_id
        FROM game_sessions gs
        JOIN users u ON u.id = gs.user_id
        WHERE gs.challenge_id = ?
          AND gs.status = 'verified'
        ORDER BY gs.score DESC, gs.created_at ASC
        LIMIT ?
        OFFSET ?
      `,
      [id, limit, offset]
    );

    return {
      challenge: {
        id: challenge.id,
        challenge_date: toDateString(challenge.challenge_date),
        mode_key: challenge.mode_key,
        status: challenge.status,
        title: challenge.title
      },
      limit,
      offset,
      items: result.rows.map((row, idx) => ({
        rank: offset + idx + 1,
        username: row.username,
        score: row.score,
        best_tile: row.best_tile,
        duration_ms: row.duration_ms,
        ended_at: row.ended_at,
        session_id: row.session_id
      }))
    };
  });
}

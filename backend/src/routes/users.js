import { pool } from "../db.js";

function parsePositiveInt(value, fallback, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  if (typeof max === "number" && n > max) return max;
  return n;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function normalizeExportStatus(value) {
  if (!value) return "all";
  const normalized = String(value).trim().toLowerCase();
  if (["all", "verified", "pending", "rejected"].includes(normalized)) return normalized;
  return "";
}

function sanitizeFilePart(value, fallback = "user") {
  const raw = typeof value === "string" ? value : "";
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 64) || fallback;
}

export async function usersRoutes(fastify) {
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

  fastify.get("/users/:username/history", async (request, reply) => {
    const { username } = request.params;
    const modeKey = request.query.mode_key;
    const legacyMode = request.query.mode;
    const page = parsePositiveInt(request.query.page, 1, 100000);
    const pageSize = parsePositiveInt(request.query.page_size, 20, 100);
    const offset = (page - 1) * pageSize;

    const userResult = await pool.query(
      `
        SELECT id, username
        FROM users
        WHERE username = ?
      `,
      [username]
    );
    const user = userResult.rows[0];
    if (!user) {
      return reply.code(404).send({ error: "user_not_found" });
    }

    const params = [user.id];
    let modeClause = "";
    if (modeKey) {
      modeClause = " AND gs.mode_key = ?";
      params.push(modeKey);
    } else if (legacyMode) {
      modeClause = " AND gs.mode = ?";
      params.push(legacyMode);
    }

    params.push(pageSize, offset);

    const result = await pool.query(
      `
        SELECT
          gs.id AS session_id,
          gs.mode,
          gs.mode_key,
          gs.board_width,
          gs.board_height,
          gs.ruleset,
          gs.undo_enabled,
          gs.ranked_bucket,
          gs.mode_family,
          gs.rank_policy,
          gs.special_rules_snapshot,
          gs.challenge_id,
          gs.status,
          gs.score,
          gs.best_tile,
          gs.duration_ms,
          gs.final_board,
          gs.verify_reason,
          gs.ended_at,
          gs.created_at
        FROM game_sessions gs
        WHERE gs.user_id = ?
          ${modeClause}
        ORDER BY gs.created_at DESC
        LIMIT ?
        OFFSET ?
      `,
      params
    );

    return reply.send({
      username: user.username,
      page,
      page_size: pageSize,
      items: result.rows.map((row) => ({
        session_id: row.session_id,
        mode: row.mode,
        mode_key: row.mode_key,
        board_width: row.board_width,
        board_height: row.board_height,
        ruleset: row.ruleset,
        undo_enabled: !!row.undo_enabled,
        ranked_bucket: row.ranked_bucket,
        mode_family: row.mode_family,
        rank_policy: row.rank_policy,
        special_rules_snapshot: parseJsonValue(row.special_rules_snapshot),
        challenge_id: row.challenge_id,
        status: row.status,
        score: row.score,
        best_tile: row.best_tile,
        duration_ms: row.duration_ms,
        final_board: parseJsonValue(row.final_board),
        verify_reason: row.verify_reason,
        ended_at: row.ended_at,
        created_at: row.created_at
      }))
    });
  });

  fastify.get(
    "/users/:username/export",
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const { username } = request.params;
      const modeKey = request.query.mode_key;
      const legacyMode = request.query.mode;
      const format = request.query.format === "ndjson" ? "ndjson" : "json";
      const includeReplay = parseBoolean(request.query.include_replay, true);
      const status = normalizeExportStatus(request.query.status);
      if (!status) {
        return reply.code(400).send({ error: "invalid_status" });
      }

      const userResult = await pool.query(
        `
          SELECT id, username, created_at
          FROM users
          WHERE username = ?
        `,
        [username]
      );
      const user = userResult.rows[0];
      if (!user) {
        return reply.code(404).send({ error: "user_not_found" });
      }

      const params = [user.id];
      let statusClause = "";
      if (status !== "all") {
        statusClause = " AND gs.status = ?";
        params.push(status);
      }

      let modeClause = "";
      if (modeKey) {
        modeClause = " AND gs.mode_key = ?";
        params.push(modeKey);
      } else if (legacyMode) {
        modeClause = " AND gs.mode = ?";
        params.push(legacyMode);
      }

      const result = await pool.query(
        `
          SELECT
            gs.id AS session_id,
            gs.mode,
            gs.mode_key,
            gs.board_width,
            gs.board_height,
            gs.ruleset,
            gs.undo_enabled,
            gs.ranked_bucket,
            gs.mode_family,
            gs.rank_policy,
            gs.special_rules_snapshot,
            gs.challenge_id,
            gs.status,
            gs.score,
            gs.best_tile,
            gs.duration_ms,
            gs.final_board,
            gs.replay_version,
            gs.replay_payload,
            gs.verify_reason,
            gs.ended_at,
            gs.created_at
          FROM game_sessions gs
          WHERE gs.user_id = ?
            ${statusClause}
            ${modeClause}
          ORDER BY gs.created_at ASC
        `,
        params
      );

      const exportedAt = new Date().toISOString();
      const mappedItems = result.rows.map((row) => {
        const item = {
          session_id: row.session_id,
          mode: row.mode,
          mode_key: row.mode_key,
          board_width: row.board_width,
          board_height: row.board_height,
          ruleset: row.ruleset,
          undo_enabled: !!row.undo_enabled,
          ranked_bucket: row.ranked_bucket,
          mode_family: row.mode_family,
          rank_policy: row.rank_policy,
          special_rules_snapshot: parseJsonValue(row.special_rules_snapshot),
          challenge_id: row.challenge_id,
          status: row.status,
          score: row.score,
          best_tile: row.best_tile,
          duration_ms: row.duration_ms,
          final_board: parseJsonValue(row.final_board),
          replay_version: row.replay_version,
          verify_reason: row.verify_reason,
          ended_at: row.ended_at,
          created_at: row.created_at
        };
        if (includeReplay) {
          item.replay = parseJsonValue(row.replay_payload);
        }
        return item;
      });

      const datePart = exportedAt.slice(0, 10).replace(/-/g, "");
      const fileSafeUser = sanitizeFilePart(user.username, "user");
      const fileNameBase = `${fileSafeUser}_sessions_${datePart}`;

      if (format === "ndjson") {
        const lines = [];
        lines.push(JSON.stringify({
          type: "meta",
          exported_at: exportedAt,
          username: user.username,
          user_id: user.id,
          user_created_at: user.created_at,
          total: mappedItems.length,
          status,
          mode_key: modeKey || null,
          mode: legacyMode || null,
          include_replay: includeReplay
        }));
        for (let i = 0; i < mappedItems.length; i += 1) {
          lines.push(JSON.stringify({
            type: "session",
            ...mappedItems[i]
          }));
        }

        reply.header("Content-Type", "application/x-ndjson; charset=utf-8");
        reply.header("Content-Disposition", `attachment; filename="${fileNameBase}.ndjson"`);
        return reply.send(lines.join("\n") + "\n");
      }

      reply.header("Content-Type", "application/json; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="${fileNameBase}.json"`);
      return reply.send({
        exported_at: exportedAt,
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at
        },
        total: mappedItems.length,
        filters: {
          status,
          mode_key: modeKey || null,
          mode: legacyMode || null,
          include_replay: includeReplay
        },
        items: mappedItems
      });
    }
  );
}

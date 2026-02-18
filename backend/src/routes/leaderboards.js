import { pool } from "../db.js";
import { weekStartMonday } from "../utils/week.js";
import { getModeByKey, isAllowedLeaderboardBucket } from "../modes/catalog.js";

function parsePositiveInt(value, fallback, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  if (typeof max === "number" && n > max) return max;
  return n;
}

export async function leaderboardRoutes(fastify) {
  fastify.get("/leaderboards/:bucket", async (request, reply) => {
    const { bucket } = request.params;
    const period = request.query.period === "week" ? "week" : "all";
    const limit = parsePositiveInt(request.query.limit, 50, 100);
    const offset = parsePositiveInt(request.query.offset, 0, 10_000);

    // Backward compatible:
    // 1) legacy bucket: standard/classic_undo/capped
    // 2) mode key: any no-undo mode, each mode has its own ranking list
    let scopeType = null;
    let modeCfg = null;
    if (isAllowedLeaderboardBucket(bucket)) {
      scopeType = "bucket";
    } else {
      modeCfg = getModeByKey(bucket);
      if (modeCfg && modeCfg.undo_enabled === false) {
        scopeType = "mode_key";
      }
    }

    if (!scopeType) {
      return reply.code(400).send({ error: "invalid_bucket_or_mode_key" });
    }

    const params = [];
    let scopeClause = "";
    if (scopeType === "mode_key") {
      params.push(modeCfg.key);
      scopeClause = "gs.mode_key = ?";
    } else {
      params.push(bucket);
      scopeClause = "gs.ranked_bucket = ?";
    }

    let weekClause = "";
    if (period === "week") {
      const weekStart = weekStartMonday(new Date());
      params.push(weekStart);
      weekClause = " AND gs.week_start = ?";
    }

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `
        SELECT
          u.username,
          gs.score,
          gs.best_tile,
          gs.duration_ms,
          gs.ended_at,
          gs.id AS session_id,
          gs.mode_key,
          gs.board_width,
          gs.board_height,
          gs.ruleset,
          gs.undo_enabled,
          gs.mode_family,
          gs.rank_policy,
          gs.challenge_id
        FROM game_sessions gs
        JOIN users u ON u.id = gs.user_id
        WHERE ${scopeClause}
          AND gs.status = 'verified'
          ${weekClause}
        ORDER BY gs.score DESC, gs.created_at ASC
        LIMIT ?
        OFFSET ?
      `,
      params
    );

    return reply.send({
      bucket,
      scope_type: scopeType,
      mode_key: modeCfg ? modeCfg.key : null,
      mode_label: modeCfg ? modeCfg.label : null,
      period,
      limit,
      offset,
      items: result.rows.map((row, idx) => ({
        rank: offset + idx + 1,
        username: row.username,
        score: row.score,
        best_tile: row.best_tile,
        duration_ms: row.duration_ms,
        ended_at: row.ended_at,
        session_id: row.session_id,
        mode_key: row.mode_key,
        board_width: row.board_width,
        board_height: row.board_height,
        ruleset: row.ruleset,
        undo_enabled: !!row.undo_enabled,
        mode_family: row.mode_family,
        rank_policy: row.rank_policy,
        challenge_id: row.challenge_id
      }))
    });
  });
}

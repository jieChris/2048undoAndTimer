import { pool } from "../db.js";

function parsePositiveInt(value, fallback, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  if (typeof max === "number" && n > max) return max;
  return n;
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
}

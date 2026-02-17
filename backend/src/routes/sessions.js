import { pool } from "../db.js";
import { newId } from "../utils/ids.js";
import { weekStartMonday } from "../utils/week.js";
import { isValidBoard, isValidTileValue } from "../utils/validators.js";
import { config } from "../config.js";
import {
  resolveModeConfigFromRequest,
  validateModeBoundFields,
  legacyModeFromModeKey
} from "../modes/catalog.js";

function isPracticeMode(modeKey) {
  return modeKey === "practice_legacy";
}

function validateReplayV3(replay, modeCfg) {
  if (!replay || typeof replay !== "object") return "replay must be object";
  if (replay.v !== 3) return "replay.v must equal 3";
  if (typeof replay.seed !== "number" || Number.isNaN(replay.seed)) return "replay.seed must be number";
  if (replay.mode_key && replay.mode_key !== modeCfg.key) return "replay.mode_key mismatch";
  if (replay.mode && replay.mode !== legacyModeFromModeKey(modeCfg.key)) return "replay.mode mismatch";
  if (replay.board_width !== undefined && Number(replay.board_width) !== modeCfg.board_width) return "replay.board_width mismatch";
  if (replay.board_height !== undefined && Number(replay.board_height) !== modeCfg.board_height) return "replay.board_height mismatch";
  if (replay.ruleset !== undefined && replay.ruleset !== modeCfg.ruleset) return "replay.ruleset mismatch";
  if (replay.undo_enabled !== undefined && Boolean(replay.undo_enabled) !== Boolean(modeCfg.undo_enabled)) {
    return "replay.undo_enabled mismatch";
  }
  if (!Array.isArray(replay.actions)) return "replay.actions must be array";
  if (replay.actions.length > config.maxReplayActions) return "replay.actions too long";

  for (let i = 0; i < replay.actions.length; i += 1) {
    const action = replay.actions[i];
    if (!Array.isArray(action) || action.length < 1) return `invalid action at ${i}`;
    const t = action[0];

    if (t === "m") {
      if (action.length !== 2 || ![0, 1, 2, 3].includes(action[1])) return `invalid move action at ${i}`;
      continue;
    }

    if (t === "u") {
      if (action.length !== 1) return `invalid undo action at ${i}`;
      if (!modeCfg.undo_enabled) return `undo not allowed at ${i}`;
      continue;
    }

    if (t === "p") {
      if (!isPracticeMode(modeCfg.key)) return `practice action not allowed at ${i}`;
      if (action.length !== 4) return `invalid practice action at ${i}`;
      const [_, x, y, value] = action;
      if (![x, y, value].every((n) => Number.isInteger(n))) return `invalid practice numeric at ${i}`;
      if (x < 0 || x >= modeCfg.board_width || y < 0 || y >= modeCfg.board_height) {
        return `invalid practice coordinates at ${i}`;
      }
      if (!isValidTileValue(value, modeCfg.ruleset)) {
        return `invalid practice value at ${i}`;
      }
      continue;
    }

    return `unknown action type at ${i}`;
  }

  return null;
}

export async function sessionsRoutes(fastify) {
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

  fastify.post(
    "/sessions/complete",
    {
      preHandler: fastify.authenticate,
      config: {
        rateLimit: {
          max: 60,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const {
        mode,
        mode_key: modeKey,
        board_width: boardWidth,
        board_height: boardHeight,
        ruleset,
        undo_enabled: undoEnabled,
        ranked_bucket: rankedBucket,
        score,
        best_tile: bestTile,
        duration_ms: durationMs,
        final_board: finalBoard,
        ended_at: endedAt,
        replay,
        client_version: clientVersion
      } = request.body || {};

      const resolved = resolveModeConfigFromRequest({ mode, mode_key: modeKey });
      if (resolved.error || !resolved.mode) {
        return reply.code(400).send({ error: "invalid mode_key" });
      }
      const modeCfg = resolved.mode;
      const legacyMode = resolved.legacyMode;

      const modeBoundErr = validateModeBoundFields({
        board_width: boardWidth,
        board_height: boardHeight,
        ruleset,
        undo_enabled: undoEnabled,
        ranked_bucket: rankedBucket
      }, modeCfg);
      if (modeBoundErr) {
        return reply.code(400).send({ error: modeBoundErr });
      }

      if (!Number.isInteger(score) || score < 0) {
        return reply.code(400).send({ error: "invalid score" });
      }
      if (!Number.isInteger(bestTile) || bestTile < 0) {
        return reply.code(400).send({ error: "invalid best_tile" });
      }
      if (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > 86_400_000) {
        return reply.code(400).send({ error: "invalid duration_ms" });
      }
      if (!isValidBoard(finalBoard, modeCfg.board_width, modeCfg.board_height, modeCfg.ruleset)) {
        return reply.code(400).send({ error: "invalid final_board" });
      }

      const endedAtDate = new Date(endedAt);
      if (Number.isNaN(endedAtDate.getTime())) {
        return reply.code(400).send({ error: "invalid ended_at" });
      }

      const replayErr = validateReplayV3(replay, modeCfg);
      if (replayErr) {
        return reply.code(400).send({ error: replayErr });
      }

      const sessionId = newId();
      const weekStart = weekStartMonday(endedAtDate);

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `
            INSERT INTO game_sessions (
              id, user_id, mode, mode_key, board_width, board_height,
              ruleset, undo_enabled, ranked_bucket,
              status, score, best_tile, duration_ms,
              final_board, replay_version, replay_payload, client_version,
              ended_at, week_start
            )
            VALUES (
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?,
              'pending', ?, ?, ?,
              ?, 3, ?, ?,
              ?, ?
            )
          `,
          [
            sessionId,
            request.user.sub,
            legacyMode,
            modeCfg.key,
            modeCfg.board_width,
            modeCfg.board_height,
            modeCfg.ruleset,
            modeCfg.undo_enabled,
            modeCfg.ranked_bucket,
            score,
            bestTile,
            durationMs,
            JSON.stringify(finalBoard),
            JSON.stringify(replay),
            clientVersion || null,
            endedAtDate,
            weekStart
          ]
        );

        await client.query(
          `
            INSERT INTO verify_jobs (session_id, status)
            VALUES (?, 'queued')
          `,
          [sessionId]
        );

        await client.query("COMMIT");
        return reply.send({ session_id: sessionId, verify_status: "pending" });
      } catch (error) {
        await client.query("ROLLBACK");
        request.log.error({ err: error }, "session_complete_failed");
        return reply.code(500).send({ error: "session_complete_failed" });
      } finally {
        client.release();
      }
    }
  );

  fastify.get("/sessions/:id", async (request, reply) => {
    const { id } = request.params;
    const result = await pool.query(
      `
        SELECT
          gs.id,
          u.username,
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
          gs.replay_version,
          gs.replay_payload,
          gs.verify_reason,
          gs.ended_at,
          gs.created_at
        FROM game_sessions gs
        JOIN users u ON u.id = gs.user_id
        WHERE gs.id = ?
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: "session_not_found" });
    }

    const row = result.rows[0];
    const replayPayload = parseJsonValue(row.replay_payload);
    const finalBoardPayload = parseJsonValue(row.final_board);
    return reply.send({
      session_id: row.id,
      username: row.username,
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
      final_board: finalBoardPayload,
      replay_version: row.replay_version,
      replay: replayPayload,
      verify_reason: row.verify_reason,
      ended_at: row.ended_at,
      created_at: row.created_at
    });
  });
}

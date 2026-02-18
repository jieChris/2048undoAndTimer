import { pool } from "./db.js";
import { config, requireConfig } from "./config.js";
import { verifySessionReplay } from "./replay/verify.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function claimJob() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const claimed = await client.query(
      `
        SELECT vj.id, vj.session_id, vj.attempts
        FROM verify_jobs vj
        WHERE vj.attempts < $1
          AND (
            (vj.status IN ('queued', 'failed') AND vj.available_at <= now())
            OR
            (vj.status = 'running' AND vj.updated_at < DATE_SUB(NOW(3), INTERVAL 5 MINUTE))
          )
        ORDER BY vj.available_at ASC, vj.id ASC
        LIMIT 1 FOR UPDATE SKIP LOCKED
        
      `,
      [config.workerMaxAttempts]
    );

    if (claimed.rows.length === 0) {
      await client.query("COMMIT");
      return null;
    }

    const job = claimed.rows[0];

    await client.query(
      `
        UPDATE verify_jobs
        SET status = 'running', attempts = attempts + 1, last_error = NULL
        WHERE id = $1
      `,
      [job.id]
    );

    const sessionResult = await client.query(
      `
        SELECT
          id, mode, mode_key, board_width, board_height, ruleset,
          undo_enabled, ranked_bucket, mode_family, rank_policy, special_rules_snapshot,
          score, best_tile, final_board, replay_payload
        FROM game_sessions
        WHERE id = $1
      `,
      [job.session_id]
    );

    if (sessionResult.rows.length === 0) {
      await client.query(
        `
          UPDATE verify_jobs
          SET status = 'done', last_error = 'session_not_found'
          WHERE id = $1
        `,
        [job.id]
      );
      await client.query("COMMIT");
      return null;
    }

    await client.query("COMMIT");
    return {
      id: job.id,
      attempts: job.attempts + 1,
      session: sessionResult.rows[0]
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function markVerified(jobId, sessionId, computed) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        UPDATE game_sessions
        SET status = 'verified',
            score = $2,
            best_tile = $3,
            final_board = $4,
            verify_reason = NULL
        WHERE id = $1
      `,
      [sessionId, computed.score, computed.bestTile, JSON.stringify(computed.finalBoard)]
    );

    await client.query(
      `
        UPDATE verify_jobs
        SET status = 'done', last_error = NULL
        WHERE id = $1
      `,
      [jobId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function markRejected(jobId, sessionId, reason) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        UPDATE game_sessions
        SET status = 'rejected', verify_reason = $2
        WHERE id = $1
      `,
      [sessionId, reason]
    );

    await client.query(
      `
        UPDATE verify_jobs
        SET status = 'done', last_error = NULL
        WHERE id = $1
      `,
      [jobId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function markFailed(job, error) {
  const nextDelaySeconds = Math.min(60, 2 ** Math.min(job.attempts, 6));
  const availableAt = new Date(Date.now() + nextDelaySeconds * 1000);
  await pool.query(
    `
      UPDATE verify_jobs
      SET status = 'failed',
          last_error = $2,
          available_at = $3
      WHERE id = $1
    `,
    [job.id, String(error && error.message ? error.message : error), availableAt]
  );
}

let running = true;

process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});

async function loop() {
  requireConfig();
  while (running) {
    const job = await claimJob();
    if (!job) {
      await sleep(config.workerPollIntervalMs);
      continue;
    }

    try {
      const replay = JSON.parse(job.session.replay_payload);
      const finalBoard = typeof job.session.final_board === "string"
        ? JSON.parse(job.session.final_board)
        : job.session.final_board;
      const result = verifySessionReplay({
        mode: job.session.mode,
        modeKey: job.session.mode_key,
        boardWidth: job.session.board_width,
        boardHeight: job.session.board_height,
        ruleset: job.session.ruleset,
        undoEnabled: !!job.session.undo_enabled,
        rankedBucket: job.session.ranked_bucket,
        modeFamily: job.session.mode_family,
        rankPolicy: job.session.rank_policy,
        specialRulesSnapshot: typeof job.session.special_rules_snapshot === "string"
          ? JSON.parse(job.session.special_rules_snapshot)
          : job.session.special_rules_snapshot,
        replay,
        clientScore: job.session.score,
        clientBestTile: job.session.best_tile,
        clientFinalBoard: finalBoard
      });

      if (result.ok) {
        await markVerified(job.id, job.session.id, result.computed);
      } else {
        await markRejected(job.id, job.session.id, result.reason || "verify_failed");
      }
    } catch (error) {
      await markFailed(job, error);
    }
  }

  await pool.end();
}

loop().catch((error) => {
  console.error("worker_fatal", error);
  process.exit(1);
});

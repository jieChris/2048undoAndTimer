import { config } from "../config.js";
import { pool } from "../db.js";
import { newId } from "../utils/ids.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { hashToken, randomToken } from "../utils/tokens.js";
import { compileBlockedRegex, normalizeDeviceId, validateUsernameSafety } from "../utils/auth_security.js";
import { validatePasswordStrength, validateUsername } from "../utils/validators.js";

function accessTokenFor(fastify, user) {
  return fastify.jwt.sign(
    {
      sub: user.id,
      username: user.username
    },
    {
      expiresIn: config.accessTokenTtlSeconds
    }
  );
}

async function createRefreshToken({ userId, ip, userAgent }) {
  const plain = randomToken();
  const hashed = hashToken(plain);
  const refreshId = newId();
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await pool.query(
    `
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [refreshId, userId, hashed, expiresAt, ip || null, userAgent || null]
  );
  return plain;
}

function userResponse(userRow) {
  return {
    id: userRow.id,
    username: userRow.username,
    created_at: userRow.created_at,
    last_login_at: userRow.last_login_at
  };
}

const blockedUsernameRegex = compileBlockedRegex(config.usernameBlockedRegex);

function isMissingRegisterAttemptsTable(err) {
  return !!(err && err.code === "ER_NO_SUCH_TABLE");
}

async function cleanupRegisterAttemptsIfNeeded(request) {
  if (config.registerAttemptsRetentionDays <= 0) return;
  if (Math.random() > 0.02) return;

  const cutoff = new Date(Date.now() - config.registerAttemptsRetentionDays * 24 * 60 * 60 * 1000);
  try {
    await pool.query("DELETE FROM register_attempts WHERE created_at < ?", [cutoff]);
  } catch (err) {
    if (!isMissingRegisterAttemptsTable(err)) {
      request.log.warn({ err }, "register_attempts_cleanup_failed");
    }
  }
}

async function getRegisterAttemptCountByIp(ip, since) {
  const result = await pool.query(
    "SELECT COUNT(*) AS cnt FROM register_attempts WHERE ip = ? AND created_at >= ?",
    [ip, since]
  );
  return Number(result.rows[0] && result.rows[0].cnt ? result.rows[0].cnt : 0);
}

async function getRegisterAttemptCountByDevice(deviceId, since) {
  const result = await pool.query(
    "SELECT COUNT(*) AS cnt FROM register_attempts WHERE device_id = ? AND created_at >= ?",
    [deviceId, since]
  );
  return Number(result.rows[0] && result.rows[0].cnt ? result.rows[0].cnt : 0);
}

async function checkRegisterRateLimit(request, { ip, deviceId }) {
  if (!ip || config.registerLimitWindowSeconds <= 0) {
    return { ok: true, reason: "" };
  }

  const since = new Date(Date.now() - config.registerLimitWindowSeconds * 1000);

  try {
    if (config.registerLimitPerIp > 0) {
      const ipCount = await getRegisterAttemptCountByIp(ip, since);
      if (ipCount >= config.registerLimitPerIp) {
        return { ok: false, reason: "ip" };
      }
    }

    if (deviceId && config.registerLimitPerDevice > 0) {
      const deviceCount = await getRegisterAttemptCountByDevice(deviceId, since);
      if (deviceCount >= config.registerLimitPerDevice) {
        return { ok: false, reason: "device" };
      }
    }
  } catch (err) {
    if (isMissingRegisterAttemptsTable(err)) {
      request.log.warn("register_attempts_table_missing_rate_limit_skipped");
      return { ok: true, reason: "" };
    }
    throw err;
  }

  return { ok: true, reason: "" };
}

async function logRegisterAttempt(request, payload) {
  const ip = payload && payload.ip ? String(payload.ip) : "";
  if (!ip) return;
  const username = payload && typeof payload.username === "string" ? payload.username.slice(0, 20) : null;
  const deviceId = payload && payload.deviceId ? String(payload.deviceId).slice(0, 128) : null;
  const success = payload && payload.success ? 1 : 0;
  const reason = payload && payload.reason ? String(payload.reason).slice(0, 64) : null;

  try {
    await pool.query(
      `
        INSERT INTO register_attempts (ip, device_id, username, success, reason)
        VALUES (?, ?, ?, ?, ?)
      `,
      [ip, deviceId, username, success, reason]
    );
  } catch (err) {
    if (!isMissingRegisterAttemptsTable(err)) {
      request.log.warn({ err }, "register_attempt_log_failed");
    }
  }
}

export async function authRoutes(fastify) {
  fastify.post(
    "/auth/register",
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const { username, password } = request.body || {};
      const normalizedUsername = typeof username === "string" ? username.trim() : username;
      const rawDeviceId = request.headers["x-device-id"];
      const deviceId = normalizeDeviceId(Array.isArray(rawDeviceId) ? rawDeviceId[0] : rawDeviceId);
      const ip = typeof request.ip === "string" ? request.ip : "";

      await cleanupRegisterAttemptsIfNeeded(request);

      let rateLimitCheck;
      try {
        rateLimitCheck = await checkRegisterRateLimit(request, { ip, deviceId });
      } catch (error) {
        request.log.error({ err: error }, "register_rate_limit_check_failed");
        return reply.code(500).send({ error: "register_failed" });
      }
      if (!rateLimitCheck.ok) {
        await logRegisterAttempt(request, {
          ip,
          deviceId,
          username: normalizedUsername,
          success: false,
          reason: rateLimitCheck.reason === "device"
            ? "blocked_by_device_rate_limit"
            : "blocked_by_ip_rate_limit"
        });
        return reply.code(429).send({
          error: rateLimitCheck.reason === "device"
            ? "too_many_registrations_from_device"
            : "too_many_registrations_from_ip"
        });
      }

      if (!validateUsername(normalizedUsername)) {
        await logRegisterAttempt(request, {
          ip,
          deviceId,
          username: normalizedUsername,
          success: false,
          reason: "invalid_username_format"
        });
        return reply.code(400).send({ error: "username must be 3-20 chars: letters, digits, underscore" });
      }

      const usernameSafety = validateUsernameSafety(normalizedUsername, {
        reservedWords: config.usernameReservedWords,
        sensitiveWords: config.usernameSensitiveWords,
        blockedRegex: blockedUsernameRegex
      });
      if (!usernameSafety.ok) {
        await logRegisterAttempt(request, {
          ip,
          deviceId,
          username: normalizedUsername,
          success: false,
          reason: usernameSafety.code || "blocked_username"
        });
        return reply.code(400).send({ error: "username_not_allowed" });
      }

      if (!validatePasswordStrength(password)) {
        await logRegisterAttempt(request, {
          ip,
          deviceId,
          username: normalizedUsername,
          success: false,
          reason: "weak_password"
        });
        return reply.code(400).send({ error: "password must be >=8 and include letters+digits" });
      }

      const passwordHash = await hashPassword(password);
      const userId = newId();

      try {
        await pool.query(
          `
            INSERT INTO users (id, username, password_hash)
            VALUES (?, ?, ?)
          `,
          [userId, normalizedUsername, passwordHash]
        );

        const userResult = await pool.query(
          `
            SELECT id, username, created_at, last_login_at
            FROM users
            WHERE id = ?
          `,
          [userId]
        );
        const user = userResult.rows[0];
        const accessToken = accessTokenFor(fastify, user);
        const refreshToken = await createRefreshToken({
          userId: user.id,
          ip: request.ip,
          userAgent: request.headers["user-agent"]
        });

        await logRegisterAttempt(request, {
          ip,
          deviceId,
          username: normalizedUsername,
          success: true,
          reason: "ok"
        });

        return reply.send({
          user: userResponse(user),
          access_token: accessToken,
          refresh_token: refreshToken
        });
      } catch (error) {
        if (error && error.code === "ER_DUP_ENTRY") {
          await logRegisterAttempt(request, {
            ip,
            deviceId,
            username: normalizedUsername,
            success: false,
            reason: "duplicate_username"
          });
          return reply.code(409).send({ error: "username already exists" });
        }
        await logRegisterAttempt(request, {
          ip,
          deviceId,
          username: normalizedUsername,
          success: false,
          reason: "register_failed"
        });
        request.log.error({ err: error }, "register_failed");
        return reply.code(500).send({ error: "register_failed" });
      }
    }
  );

  fastify.post("/auth/login", async (request, reply) => {
    const { username, password } = request.body || {};
    if (typeof username !== "string" || typeof password !== "string") {
      return reply.code(400).send({ error: "invalid credentials" });
    }

    const userResult = await pool.query(
      `
        SELECT id, username, password_hash, created_at, last_login_at
        FROM users
        WHERE username = $1
      `,
      [username]
    );
    const user = userResult.rows[0];
    if (!user) {
      return reply.code(401).send({ error: "invalid credentials" });
    }

    const ok = await verifyPassword(user.password_hash, password);
    if (!ok) {
      return reply.code(401).send({ error: "invalid credentials" });
    }

    await pool.query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);
    user.last_login_at = new Date().toISOString();

    const accessToken = accessTokenFor(fastify, user);
    const refreshToken = await createRefreshToken({
      userId: user.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"]
    });

    return reply.send({
      user: userResponse(user),
      access_token: accessToken,
      refresh_token: refreshToken
    });
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const { refresh_token: refreshToken } = request.body || {};
    if (typeof refreshToken !== "string" || refreshToken.length < 16) {
      return reply.code(400).send({ error: "invalid refresh token" });
    }

    const tokenHash = hashToken(refreshToken);
    const result = await pool.query(
      `
        SELECT rt.id, rt.user_id, u.username
        FROM refresh_tokens rt
        JOIN users u ON u.id = rt.user_id
        WHERE rt.token_hash = $1
          AND rt.revoked_at IS NULL
          AND rt.expires_at > now()
      `,
      [tokenHash]
    );

    const row = result.rows[0];
    if (!row) {
      return reply.code(401).send({ error: "invalid refresh token" });
    }

    await pool.query("UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1", [row.id]);

    const newRefreshToken = await createRefreshToken({
      userId: row.user_id,
      ip: request.ip,
      userAgent: request.headers["user-agent"]
    });
    const accessToken = accessTokenFor(fastify, { id: row.user_id, username: row.username });

    return reply.send({
      access_token: accessToken,
      refresh_token: newRefreshToken
    });
  });

  fastify.post("/auth/logout", async (request, reply) => {
    const { refresh_token: refreshToken } = request.body || {};
    if (typeof refreshToken === "string" && refreshToken.length >= 16) {
      const tokenHash = hashToken(refreshToken);
      await pool.query(
        `
          UPDATE refresh_tokens
          SET revoked_at = now()
          WHERE token_hash = $1
            AND revoked_at IS NULL
        `,
        [tokenHash]
      );
    }
    return reply.code(204).send();
  });

  fastify.get(
    "/auth/me",
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const result = await pool.query(
        `
          SELECT id, username, created_at, last_login_at
          FROM users
          WHERE id = $1
        `,
        [userId]
      );
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: "user_not_found" });
      }
      return reply.send({ user: userResponse(result.rows[0]) });
    }
  );
}

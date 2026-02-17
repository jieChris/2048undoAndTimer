import { config } from "../config.js";
import { pool } from "../db.js";
import { newId } from "../utils/ids.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { hashToken, randomToken } from "../utils/tokens.js";
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

export async function authRoutes(fastify) {
  fastify.post("/auth/register", async (request, reply) => {
    const { username, password } = request.body || {};

    if (!validateUsername(username)) {
      return reply.code(400).send({ error: "username must be 3-20 chars: letters, digits, underscore" });
    }
    if (!validatePasswordStrength(password)) {
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
        [userId, username, passwordHash]
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

      return reply.send({
        user: userResponse(user),
        access_token: accessToken,
        refresh_token: refreshToken
      });
    } catch (error) {
      if (error && error.code === "ER_DUP_ENTRY") {
        return reply.code(409).send({ error: "username already exists" });
      }
      request.log.error({ err: error }, "register_failed");
      return reply.code(500).send({ error: "register_failed" });
    }
  });

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

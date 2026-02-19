import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { healthcheckDb } from "./db.js";
import { authRoutes } from "./routes/auth.js";
import { sessionsRoutes } from "./routes/sessions.js";
import { leaderboardRoutes } from "./routes/leaderboards.js";
import { usersRoutes } from "./routes/users.js";
import { challengeRoutes } from "./routes/challenges.js";

export function createApp() {
  const app = Fastify({
    trustProxy: config.trustProxy,
    logger: {
      level: config.nodeEnv === "production" ? "info" : "debug"
    }
  });

  app.register(cors, {
    origin: config.corsOrigin.length === 0 ? true : config.corsOrigin,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Device-Id"]
  });

  app.register(jwt, {
    secret: config.jwtSecret
  });

  app.decorate("authenticate", async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch (_err) {
      return reply.code(401).send({ error: "unauthorized" });
    }
  });

  app.register(rateLimit, {
    global: true,
    max: 180,
    timeWindow: "1 minute"
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request_failed");

    const statusCode = error && error.statusCode && error.statusCode >= 400
      ? error.statusCode
      : 500;

    if (config.nodeEnv === "production") {
      return reply.code(statusCode).send({ error: "Internal Server Error" });
    }

    return reply.code(statusCode).send({
      error: error && error.message ? error.message : "Internal Server Error",
      code: error && error.code ? error.code : null
    });
  });

  app.get("/healthz", async () => {
    await healthcheckDb();
    return { ok: true };
  });

  app.register(async (api) => {
    api.register(authRoutes);
    api.register(sessionsRoutes);
    api.register(leaderboardRoutes);
    api.register(usersRoutes);
    api.register(challengeRoutes);
  }, { prefix: "/api/v1" });

  return app;
}

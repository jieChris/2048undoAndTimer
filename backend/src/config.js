import process from "node:process";

function toInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toCsv(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  host: process.env.HOST || "0.0.0.0",
  port: toInt(process.env.PORT, 3001),
  databaseUrl: process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/game2048",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  accessTokenTtlSeconds: toInt(process.env.ACCESS_TOKEN_TTL_SECONDS, 900),
  refreshTokenTtlDays: toInt(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
  corsOrigin: toCsv(process.env.CORS_ORIGIN),
  maxReplayActions: toInt(process.env.MAX_REPLAY_ACTIONS, 200000),
  workerPollIntervalMs: toInt(process.env.WORKER_POLL_INTERVAL_MS, 300),
  workerMaxAttempts: toInt(process.env.WORKER_MAX_ATTEMPTS, 5)
};

export function requireConfig() {
  if (config.nodeEnv === "production" && (!config.jwtSecret || config.jwtSecret.length < 24)) {
    throw new Error("JWT_SECRET must be set to a long random value (>=24 chars)");
  }
}

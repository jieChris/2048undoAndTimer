import process from "node:process";

function toInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function toCsv(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function toCsvLower(value) {
  return toCsv(value).map((part) => part.toLowerCase());
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  trustProxy: toBool(process.env.TRUST_PROXY, true),
  host: process.env.HOST || "0.0.0.0",
  port: toInt(process.env.PORT, 3001),
  databaseUrl: process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/game2048",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  accessTokenTtlSeconds: toInt(process.env.ACCESS_TOKEN_TTL_SECONDS, 900),
  refreshTokenTtlDays: toInt(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
  corsOrigin: toCsv(process.env.CORS_ORIGIN),
  usernameReservedWords: toCsvLower(
    process.env.USERNAME_RESERVED_WORDS ||
    "admin,administrator,root,system,official,support,service,staff,moderator"
  ),
  usernameSensitiveWords: toCsvLower(process.env.USERNAME_SENSITIVE_WORDS || ""),
  usernameBlockedRegex: process.env.USERNAME_BLOCKED_REGEX || "",
  registerLimitWindowSeconds: toInt(process.env.REGISTER_LIMIT_WINDOW_SECONDS, 3600),
  registerLimitPerIp: toInt(process.env.REGISTER_LIMIT_PER_IP, 6),
  registerLimitPerDevice: toInt(process.env.REGISTER_LIMIT_PER_DEVICE, 4),
  registerAttemptsRetentionDays: toInt(process.env.REGISTER_ATTEMPTS_RETENTION_DAYS, 30),
  maxReplayActions: toInt(process.env.MAX_REPLAY_ACTIONS, 200000),
  workerPollIntervalMs: toInt(process.env.WORKER_POLL_INTERVAL_MS, 300),
  workerMaxAttempts: toInt(process.env.WORKER_MAX_ATTEMPTS, 5)
};

export function requireConfig() {
  if (config.nodeEnv === "production" && (!config.jwtSecret || config.jwtSecret.length < 24)) {
    throw new Error("JWT_SECRET must be set to a long random value (>=24 chars)");
  }
}

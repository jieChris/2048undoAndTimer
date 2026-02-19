# 2048 Backend (Auth + Leaderboard + Anti-cheat)

## Stack
- Node.js 20
- Fastify
- MySQL 8
- Argon2id
- JWT Access + Refresh
- Replay v3 server verification worker

## Quick Start
1. Copy env:
```bash
cp .env.example .env
```
2. Install dependencies:
```bash
npm install
```
3. Run migrations:
```bash
npm run migrate
```
4. Start API:
```bash
npm run dev
```
5. Start worker (new terminal):
```bash
npm run dev:worker
```

## API Prefix
- `/api/v1`

## Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /sessions/complete`
- `GET /sessions/:id`
- `GET /leaderboards/:mode?period=all|week&limit=50&offset=0`
- `GET /users/:username/history?mode=&page=&page_size=`
- `GET /users/:username/export?format=json|ndjson&status=all|verified|pending|rejected&mode_key=&mode=&include_replay=true|false`

## Export API 文档
- 详见：`backend/EXPORT_API.md`

## Anti-cheat
- Client metrics are untrusted.
- Worker replays `replay v3` on server engine.
- Only `status=verified` enters leaderboard.

## Deployment Notes (2C2G single host)
- Recommended process split:
  - 1 API process
  - 1 worker process
  - MySQL local instance
  - Nginx reverse proxy
- Given game loop is client-side and server is used only for login/upload/reads:
  - 200 concurrent online users is normally safe.
  - 1000-3000 DAU is realistic on this setup.

## Registration Security Controls
- Username policy:
  - Format: `3-20` chars, `A-Z a-z 0-9 _`
  - Reserved words: `USERNAME_RESERVED_WORDS` (comma-separated)
  - Sensitive words: `USERNAME_SENSITIVE_WORDS` (comma-separated)
  - Optional regex block: `USERNAME_BLOCKED_REGEX`
- Registration anti-abuse (window-based):
  - `REGISTER_LIMIT_WINDOW_SECONDS`
  - `REGISTER_LIMIT_PER_IP`
  - `REGISTER_LIMIT_PER_DEVICE`
  - Attempt logs are stored in table `register_attempts`
- Device dimension:
  - Frontend sends `X-Device-Id` automatically via `js/api_client.js`
- Reverse proxy:
  - Keep `TRUST_PROXY=true` when behind Nginx/BaoTa, so IP limits use real client IP.

## Smoke Test
```bash
npm run test:engine
```

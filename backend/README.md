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

## Smoke Test
```bash
npm run test:engine
```

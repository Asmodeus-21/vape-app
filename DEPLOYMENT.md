# VapesHub Deployment Guide

This application runs as a single Node service:
- Express API in `server.ts`
- Vite-built SPA in `dist/`
- SQLite database file `vapeshub.db`

Use a host that supports a persistent Node process and persistent disk storage.

## Recommended Hosting Path

Use Render Web Service (or Railway with equivalent settings).

Why this path:
- Supports long-running Node process required by Express.
- Supports persistent disk required by SQLite.
- Keeps deployment simple with one service.

## Environment Variables

Set these in your host dashboard:

- `NODE_ENV=production`
- `PORT=10000` (Render injects this automatically; keep if required by host)
- `JWT_SECRET=<random-32-plus-char-secret>`
- `GEMINI_API_KEY=<your-google-key>`
- `CORS_ORIGIN=https://your-domain.com` (required in production)

## Build and Start Commands

- Build command: `npm ci && npm run build`
- Start command: `npm run start`

`npm run start` uses `tsx server.ts`.

## Render Setup (Concrete)

1. Create a new Web Service from your Git repository.
2. Set runtime to Node.
3. Configure commands:
   - Build: `npm ci && npm run build`
   - Start: `npm run start`
4. Add a Persistent Disk mounted at `/opt/render/project/src`.
5. Add required environment variables listed above.
6. Deploy.

## Data and Backups

SQLite file is stored at project root (`vapeshub.db`).

- Keep persistent disk enabled.
- Schedule periodic snapshots/backups from host dashboard.
- Before major releases, take a manual backup.

## Verification Before Go-Live

Run locally from project root:

```bash
npm run lint
npm run build
```

Both commands must pass before deploying.

## Post-Deploy Smoke Checks

After deployment:

1. Open `/` and verify app shell loads.
2. Verify `GET /api/products` returns JSON.
3. Register/login flow works.
4. Vendor and admin protected endpoints return `401/403` correctly when unauthorized.
5. AI chat endpoint works when `GEMINI_API_KEY` is set.

## Notes

- Static-only hosts (Pages-only setup) are not sufficient for this architecture.
- For horizontal scaling or multi-instance deployment, migrate from SQLite to a managed database first.

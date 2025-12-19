Railway Deployment Guide

This repository can be deployed to Railway either via Dockerfile (recommended) or via Node build.

Quick options

1) Dockerfile (recommended)
- Connect your GitHub repo to Railway (Project → Deployments → Connect GitHub).
- Railway will detect the `Dockerfile` in the repo and build the image. No extra build command is required.
- Set environment variables in Railway (see list below).
- Deploy.

2) Node (build + start)
- In Railway settings, set the build command to: `npm ci && npm run build`
- Set the start command to: `npm start`
- Set environment variables in Railway (see list below).

Required / Recommended environment variables
- `NODE_ENV`=production
- `PORT` (Railway will provide a port at runtime; keep this if you want to override locally)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_MAX_CONNECTIONS` (if using Postgres)
- `REDIS_HOST`, `REDIS_PORT` (if using Redis)
- Any other env vars used by your config (e.g., `QUEUE_CONCURRENCY`, `LOG_LEVEL`, etc.)

Notes about the project
- The app reads `process.env.PORT` via `src/config/index.ts`, so Railway's provided `PORT` will be respected.
- The `Dockerfile` builds the TypeScript using `npm run build` and runs `node dist/server.js`.
- `package.json` provides `build` and `start` scripts compatible with production.

Railway CLI (alternative)
- Install: https://railway.app/docs/cli
- From your project root (local):

```bash
railway login
railway init   # creates a railway project and links
railway up     # deploys the project (uses Dockerfile if present)
```

Environment variables via CLI:

```bash
railway variables set DB_HOST=... DB_PASSWORD=... --project <projectId>
```

Post-deploy checks
- Check Railway Deployments logs for build and runtime errors.
- Ensure health endpoint `/health` returns 200.
- Add resources in Railway (Postgres/Redis) via the Railway plugin UI and update env vars.

Troubleshooting
- If Railway fails to detect the right start/build commands, use the Node option and provide the build/start commands shown above.
- If you rely on external services (DB/Redis), provision them in Railway or use connection strings/secrets.

If you want, I can:
- Add a `railway.json` or sample `.env.production` file to the repo.
- Adjust the `Dockerfile` healthcheck to use dynamic `$PORT`.
- Walk through connecting this repo to Railway and setting environment variables interactively.

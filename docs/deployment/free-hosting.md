# Free Hosting Guide

This MVP should be hosted as three managed parts:

- Next.js web app on Vercel.
- NestJS REST API on Render.
- PostgreSQL database on Neon.

This is the best free-tier fit for the current architecture. It keeps PostgreSQL managed and persistent, avoids running the frontend on a sleeping server, and lets the API remain a separate service ready for Azure later.

## Trade-offs

- Render free web services may sleep when idle, so the first API request can be slow.
- Neon free databases have usage limits, so this is suitable for demo and MVP validation, not production customers.
- Vercel environment variables are build/runtime configuration, so `NEXT_PUBLIC_API_URL` must point at the deployed API URL before building.
- This setup is not the final Azure architecture. It is a low-cost preview path.

## 1. Create The Database

Create a free Neon PostgreSQL project.

Copy the pooled or direct connection string and use it as `DATABASE_URL`.

From your local project folder, push the Prisma schema and seed demo data:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require" npm run db:push
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require" npm run db:seed:demo
```

The seed should report the fixed local demo tenant:

```txt
Tenant id: 11111111-1111-4111-8111-111111111111
```

## GitHub Setup

Before connecting Vercel or Render, push the project to GitHub.

```bash
git init -b main
git add .
git commit -m "Initial vessel management system"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

The repository includes a GitHub Actions workflow at `.github/workflows/verify.yml`. It runs formatting, linting, automated tests, and the production build on pushes to `main` and on pull requests.

## 2. Deploy The API To Render

Create a new Render Blueprint from this repository, or create a Docker web service manually.

Use:

- Dockerfile: `docker/api.Dockerfile`
- Health check path: `/api/health`
- Plan: free

If you create a standard Render Node web service instead of a Docker/Blueprint service, use:

```txt
Build Command: npm ci && npm run build
Start Command: npm run start
```

The root `start` script starts the NestJS API.

Set environment variables:

```txt
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
WEB_ORIGIN=https://YOUR-VERCEL-APP.vercel.app
```

After deployment, verify:

```txt
https://YOUR-RENDER-API.onrender.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "vessel-management-api"
}
```

## 3. Deploy The Web App To Vercel

Create a Vercel project from this repository.

Use:

- Framework: Next.js
- Root directory: repository root, not `apps/web`
- Build command: `npm run build:web`
- Install command: `npm ci`
- Output directory: `apps/web/.next`

Set environment variables:

```txt
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-API.onrender.com
NEXT_PUBLIC_APP_NAME=Vessel Management System
```

## 4. Check The Demo

Open the deployed Vercel URL and check:

- `/ports`
- `/berths`
- `/vessels`
- `/vessel-calls`
- `/movements`
- `/reports`

If screens are empty, confirm the API URL is correct and the Neon database was seeded with tenant `11111111-1111-4111-8111-111111111111`.

## Best Practice For The Commercial Version

For production, move to Azure:

- Azure Container Apps or App Service for API.
- Azure Static Web Apps or App Service for web.
- Azure Database for PostgreSQL Flexible Server.
- Azure Key Vault for secrets.
- Microsoft Entra ID for enterprise identity.
- Application Insights for telemetry.

Do not use free-tier Render or Neon for paying customers.

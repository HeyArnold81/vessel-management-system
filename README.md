# Vessel Management System

Production-oriented project structure for an AI-enabled enterprise Vessel Management System.

## One-Command Build

```bash
npm run build
```

For a full local quality gate:

```bash
npm run verify
```

## Local Development

```bash
cp .env.example .env
npm install
npm run db:generate
npm run dev
```

The web app runs at `http://localhost:3000`.

To start PostgreSQL with Docker:

```bash
docker compose up postgres
```

## Folder Structure

```txt
apps/
  web/
packages/
  shared/
  database/
docker/
docs/
```

## Folder Responsibilities

### `apps/web`

The Next.js application. It owns routing, React components, Tailwind styling, browser-facing UI behavior, and Playwright tests.

Important subfolders:

- `src/app`: Next.js App Router pages, layouts, and global styles.
- `src/components`: reusable React UI components for the web application.
- `public`: static browser assets.
- `e2e`: Playwright browser tests.

### `packages/shared`

Shared TypeScript contracts that can be safely used across apps and packages. This package is intentionally narrow: shared constants, permission codes, dashboard models, and stable cross-boundary types belong here.

Business logic that belongs to backend services should not be placed here.

### `packages/database`

Database access package. It owns the Prisma schema and the Prisma client export used by application code.

Important subfolders:

- `prisma`: PostgreSQL schema definition and future migrations.
- `src`: database client wiring and exported Prisma types.

### `docker`

Container build definitions. The initial Dockerfile builds and runs the Next.js app as a standalone production server.

### `docs`

Architecture and design records. This includes the accepted architecture baseline and normalized PostgreSQL database design.

## Tooling

- Next.js for the frontend application.
- TypeScript for type safety across the workspace.
- Tailwind CSS for styling.
- Prisma for PostgreSQL data modeling and client generation.
- Docker Compose for local PostgreSQL and containerized app execution.
- ESLint for code quality.
- Prettier for formatting.
- Vitest for unit/component tests.
- Playwright for browser-level tests.

## Architecture Guardrails

- Keep frontend, shared contracts, and data access separated.
- Keep business decisions out of React components.
- Keep shared packages small and stable.
- Treat Prisma schema changes as production database changes.
- Add read models later for reporting rather than denormalizing transactional data early.

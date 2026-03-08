# Architecture

Technical architecture for Acme Corp.

## TL;DR

- **Stack**: TypeScript (Node.js backend, React frontend)
- **Database**: PostgreSQL + Redis
- **AI Engine**: Claude API (Haiku for speed, Sonnet for quality)
- **Deployment**: Docker + Railway

## Key Decisions

1. Monorepo with Turborepo
2. tRPC for type-safe API
3. Drizzle ORM over Prisma (faster, lighter)

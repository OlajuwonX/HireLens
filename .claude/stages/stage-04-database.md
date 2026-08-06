# Stage 04: Database Schema And Domain Models

Goal: add Neon PostgreSQL and normalized product records.

Implement:

- ORM setup with Prisma or Drizzle.
- Environment validation.
- Core schema for users, resumes, files, jobs, applications, analyses, documents, usage, and preferences.
- Migrations.
- Basic repository/service conventions.
- Ownership indexes and public IDs.

Rules:

- Every user-owned record must include ownership.
- Use constraints and indexes deliberately.
- Do not store file blobs in Postgres.

Validation:

- Migration runs locally.
- Typecheck passes.
- Basic database connection works.

Suggested commit message:

```text
feat: add database schema
```

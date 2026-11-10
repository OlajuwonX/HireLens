# HireLens

Live Next.js 15, TypeScript, Drizzle, Neon Postgres, Gemini app. Package manager is pnpm.

HireLens 2.0 plans live in [.claude/docs/v2/](.claude/docs/v2/README.md). Read the README there first, then the file relevant to the task.

## Rules

- Follow [engineering-standards.md](.claude/docs/v2/engineering-standards.md) and the roles in [agents.md](.claude/docs/v2/agents.md).
- No comments in code. Short, reusable files.
- Work one roadmap step at a time from [roadmap.md](.claude/docs/v2/roadmap.md). After each step, verify, report, and stop. The user commits and pushes, then types `continue`.
- Never commit, push or deploy.
- Everything must stay free to run.

## Verify

```bash
pnpm typecheck
pnpm lint
pnpm test
```

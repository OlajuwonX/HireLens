# Stage 01: Next.js Foundation

Goal: establish the production Next.js 15 foundation without building product features yet.

Implement:

- Migrate/rebuild app shell to Next.js 15 App Router.
- Use pnpm for future dependency management.
- Configure TypeScript strict mode.
- Configure Tailwind CSS.
- Configure ESLint and Prettier.
- Add base app routes and global layout.
- Add error, not-found, loading, and global-error boundaries.
- Ensure dev server runs on port `5000` or above.
- Preserve useful assets from the MVP.

Do not implement:

- Auth
- Database models
- AI flows
- Billing
- Large UI screens

Validation:

- Dev server starts on port `5000`.
- Typecheck passes.
- Lint passes if configured.
- Home route renders.

Suggested commit message:

```text
chore: establish nextjs app foundation
```

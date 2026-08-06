# Architecture Primitives

Target architecture:

- Next.js 15 App Router
- React
- TypeScript strict mode
- pnpm
- Tailwind CSS
- Radix/shadcn-style accessible primitives
- Auth.js with Google OAuth
- Neon PostgreSQL
- Prisma or Drizzle
- Zod
- TanStack Query only where interactive client server-state is useful
- Zustand only for small UI state
- Puter FS behind storage abstraction
- Puter AI behind AI abstraction

Architecture rules:

- Use Server Components by default.
- Use Client Components only for browser interaction.
- Keep Route Handlers thin.
- Put business logic in domain services.
- Put complex database queries in repositories.
- Do not import database clients into React components.
- Do not import server-only modules into client components.
- Use `server-only` in server-only files.
- Validate all untrusted inputs.
- Map internal records to safe DTOs.
- Avoid global junk-drawer utility files.

Feature folder pattern:

```text
features/<domain>/
  components/
  hooks/
  schemas/
  server/
  types/
  constants/
  utils/
```

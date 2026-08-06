# Stage 03: Authentication And Account Foundation

Goal: replace prototype auth with SaaS-ready Auth.js and Google OAuth.

Implement:

- Auth.js setup.
- Google OAuth provider.
- Application-owned user creation/update.
- Safe public user DTO.
- Sign in and sign out.
- Protected dashboard route group.
- Account settings skeleton.
- Last login tracking.
- Onboarding completion field.

Rules:

- Validate session server-side.
- Never trust client-provided user IDs.
- Do not expose provider IDs or tokens.

Validation:

- Authenticated users reach dashboard.
- Unauthenticated users are blocked from protected routes.
- Server operations derive user from session.

Suggested commit message:

```text
feat: add google authentication
```

# Auth And Security Primitives

Auth target:

- Auth.js
- Google OAuth
- Application-owned user record
- Server-side session validation
- Safe public user DTO

Never expose:

- OAuth access tokens
- OAuth refresh tokens
- Session tokens
- Provider account IDs
- Internal database records
- Raw provider errors

Every protected operation must:

1. Validate the server-side session.
2. Derive the user from the session.
3. Validate input with Zod.
4. Check resource ownership.
5. Return a safe DTO or safe error.

Fail the implementation if a user can access another user's resume, job, application, analysis, document, or file.

File security:

- PDF only at first.
- Validate extension, MIME type, size, and preferably file signature.
- Generate safe storage keys.
- Store original filename only as metadata.
- Do not expose permanent public file URLs.

Logging restrictions:

- Do not log full resumes.
- Do not log full job descriptions.
- Do not log cover letters.
- Do not log OAuth/session tokens.
- Do not log raw private AI prompts.

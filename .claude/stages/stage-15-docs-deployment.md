# Stage 15: Documentation And Deployment Readiness

Goal: make the SaaS understandable, deployable, and maintainable.

Implement:

- Replace template README.
- Document stack and architecture.
- Document local setup using pnpm.
- Document environment variables.
- Document database migration.
- Document Auth.js Google setup.
- Document Puter setup.
- Document deployment.
- Document known limitations.
- Add `.claude/project` docs if not already created.
- Add `.claude/interview-prep` docs if not already created.

Rules:

- Keep docs specific to HireLens.
- Do not include secrets.
- Keep deployment free-tier friendly but not tightly coupled to free-tier limits.

Validation:

- Fresh setup instructions are accurate.
- Production build passes.
- Deployment checklist is complete.

Suggested commit message:

```text
docs: document hirelens deployment
```

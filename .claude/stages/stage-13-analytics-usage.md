# Stage 13: Analytics And Usage Limits

Goal: add useful analytics and server-side AI usage protection.

Implement:

- AI usage service.
- Burst limits.
- Daily quotas.
- One-active-AI-request-per-user lock.
- Usage meters.
- Dashboard analytics summaries.
- Application stage distribution.
- Resume score trends.
- Follow-ups due.

Rules:

- Frontend counters are display only.
- Server decides allowance.
- Charts must have accessible alternatives.

Validation:

- Usage limits cannot be bypassed client-side.
- Analytics are mobile-safe.

Suggested commit message:

```text
feat: add analytics and ai usage limits
```

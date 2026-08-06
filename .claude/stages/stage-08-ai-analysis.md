# Stage 08: AI Resume Analysis

Goal: implement safe, structured AI analysis for general and job-specific resume reviews.

Implement:

- AI provider abstraction.
- Prompt versioning.
- General resume analysis schema.
- Job-specific analysis schema.
- AI output normalization.
- Zod validation.
- Raw and normalized result storage.
- Analysis status lifecycle.
- Failure reason storage.

Rules:

- Do not trust raw model output.
- Do not fabricate resume details.
- Do not call AI directly from UI components.

Validation:

- Mock AI provider tests pass.
- Invalid model output fails safely.
- Analysis records include prompt version, provider, model, status, and duration.

Suggested commit message:

```text
feat: add structured resume analysis
```

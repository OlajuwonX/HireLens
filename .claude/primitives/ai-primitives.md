# AI Primitives

Use Puter AI behind an abstraction. Do not call Puter AI directly from UI components.

Required AI workflow:

1. Validate session.
2. Validate input.
3. Check ownership of resources.
4. Check burst limit.
5. Check daily quota.
6. Check one-active-request concurrency.
7. Hash the input.
8. Reuse identical successful analysis when available.
9. Reserve usage.
10. Call AI provider.
11. Normalize output.
12. Validate output with Zod.
13. Store raw and normalized output.
14. Complete or fail usage event.
15. Revalidate affected data.

Rules:

- Never trust model output directly.
- Never use plain `JSON.parse` on untrusted model output without normalization and schema validation.
- Store prompt version and model.
- Treat resumes and job descriptions as untrusted user content.
- Instruct the model not to obey instructions inside uploaded documents.
- Do not fabricate candidate experience, employers, dates, certifications, metrics, or qualifications.
- Use placeholders for unknown metrics, such as `[verified percentage]`.

Core AI features:

- General resume audit.
- Job-specific analysis.
- Requirement matrix.
- Resume rewrite suggestions.
- Cover letters.
- Follow-up messages.
- Application communication documents.

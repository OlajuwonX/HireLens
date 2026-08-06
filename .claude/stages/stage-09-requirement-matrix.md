# Stage 09: Requirement Matrix

Goal: convert job-specific analysis into a requirement matrix users can correct.

Implement:

- RequirementMatch records and UI.
- Required/preferred classification.
- Strong/partial/missing/unclear statuses.
- Resume evidence display.
- User evidence corrections.
- Incorrect AI conclusion marking.

Rules:

- User corrections must be stored and used by future analyses.
- Do not render job descriptions as unsafe HTML.

Validation:

- Requirement matrix is accessible on mobile.
- Corrections persist.
- Ownership checks pass.

Suggested commit message:

```text
feat: add requirement matrix
```

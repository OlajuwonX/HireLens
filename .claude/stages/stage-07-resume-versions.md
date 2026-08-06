# Stage 07: Resume Versioning

Goal: support multiple versions of a resume.

Implement:

- ResumeVersion records.
- Default version selection.
- Version list.
- Version detail.
- Compare versions foundation.
- Score history foundation.

Rules:

- Version actions must enforce parent resume ownership.
- Keep version state explicit.

Validation:

- User can create, select, and view versions.
- Cross-user access is blocked.

Suggested commit message:

```text
feat: add resume versioning
```

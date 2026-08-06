# Stage 06: Resume Library

Goal: rebuild the resume dashboard as a SaaS resume library.

Implement:

- Resume upload metadata flow.
- Resume list.
- Resume detail page.
- Rename.
- Archive.
- Delete.
- Status display.
- Retry failed processing action placeholder.
- Empty/loading/error states.
- Mobile list layout.

Rules:

- Server validates ownership for every action.
- UI uses primitives from Stage 02.

Validation:

- User can manage only their own resumes.
- Bad records do not crash the UI.
- Mobile layouts have no horizontal overflow.

Suggested commit message:

```text
feat: build resume library
```

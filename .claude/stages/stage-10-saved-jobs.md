# Stage 10: Saved Jobs

Goal: add manual saved-job management.

Implement:

- Create/edit/duplicate/archive/delete jobs.
- Job title, company, location, work arrangement, employment type, salary, source URL, description, requirements, deadline, notes.
- Long-text mobile-friendly job description input.
- Search/filter/sort.
- Attach selected resume version.

Rules:

- Treat job descriptions as plain text.
- Validate URLs and enum values.

Validation:

- Saved jobs are user-owned.
- Long descriptions work on mobile and desktop.

Suggested commit message:

```text
feat: add saved jobs
```

# 15 Connected Implementation Stages

These stages break `.claude/prompt.md` into commit-sized work. The assistant should implement one stage at a time, run QC, then stop so the project owner can review and commit.

The project owner will create commits manually.

Commit rule:

- Do not auto-commit.
- Keep each stage independently reviewable.
- Run the Quality Control Agent after each stage.
- Use port `5000` or above for local development.

Stages:

1. `stage-01-foundation.md`
2. `stage-02-design-primitives.md`
3. `stage-03-auth.md`
4. `stage-04-database.md`
5. `stage-05-storage.md`
6. `stage-06-resume-library.md`
7. `stage-07-resume-versions.md`
8. `stage-08-ai-analysis.md`
9. `stage-09-requirement-matrix.md`
10. `stage-10-saved-jobs.md`
11. `stage-11-applications.md`
12. `stage-12-documents.md`
13. `stage-13-analytics-usage.md`
14. `stage-14-testing-hardening.md`
15. `stage-15-docs-deployment.md`

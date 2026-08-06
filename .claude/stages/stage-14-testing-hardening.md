# Stage 14: Testing, Security, Accessibility, Performance

Goal: harden the product before deployment.

Implement:

- Unit tests for schemas and utilities.
- Integration tests for protected workflows.
- Playwright smoke flows.
- Cross-user access tests.
- Accessibility checks.
- Mobile overflow checks.
- Performance review of heavy libraries.
- Error/logging safety review.

Rules:

- Mock external providers.
- Do not call Puter AI in normal tests.
- Do not log sensitive resume/job/document content.

Validation:

- Typecheck passes.
- Lint passes.
- Test suite passes.
- QC Agent produces pass or pass with notes.

Suggested commit message:

```text
test: harden core workflows
```

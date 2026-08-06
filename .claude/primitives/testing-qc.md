# Testing And QC Primitives

Minimum checks per stage:

- Typecheck
- Lint when configured
- Unit tests for changed logic
- Integration tests for changed protected workflows
- Playwright for important user paths
- Manual mobile layout review at 320px, 375px, 768px, 1024px, and desktop

Unit test targets:

- Zod schemas
- Score normalization
- AI output normalization
- Input hashing
- Usage calculations
- Rate-limit decisions
- Permission checks
- Date helpers
- Analytics calculations

Integration test targets:

- Saved job creation
- Resume metadata upload
- Resume version creation
- Analysis reservation/completion
- Cross-user access prevention
- Generated document creation
- Application stage updates

Do not call Puter AI during normal automated tests. Mock external providers.

Use `.claude/agents/quality-control-agent.md` before each user-created commit.

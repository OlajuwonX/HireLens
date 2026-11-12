# HireLens local worker

Fills in the applications you approved in HireLens, in Chrome or Edge on your own computer. Free, and nothing runs on a server.

## Setup

1. Install Node.js 20+ and Google Chrome or Microsoft Edge.
2. In HireLens, open **Settings > Local worker** and create a token.
3. In this folder:

```bash
pnpm install --ignore-workspace
cp .env.example .env
```

4. Paste the token into `.env` as `HIRELENS_WORKER_TOKEN`.
5. Start it:

```bash
pnpm start
```

## What it does

For each approved application it opens the job's form, fills every field it can from your career profile, answer bank, cover letter and optimized resume, then reads each field back to check it.

By default it **does not press submit**. You check the form and submit it yourself; the worker watches for the confirmation page and records it in HireLens.

| Setting | Default | Effect |
| --- | --- | --- |
| `AUTO_SUBMIT` | `false` | Submit automatically, only when every field is filled and verified and there is no CAPTCHA |
| `USE_CLAUDE` | `false` | Draft answers to unanswered free-text questions with your local Claude Code CLI. Drafts are never auto-submitted |
| `BROWSER_CHANNEL` | `chrome` | `chrome` or `msedge` |
| `CONFIRM_TIMEOUT_MINUTES` | `15` | How long to wait for you to submit |

It never answers questions about gender, ethnicity, veteran or disability status, and never ticks consent boxes.

If it stops after a form was submitted but before a confirmation appeared, HireLens marks the application unconfirmed instead of retrying it.

## Tests

```bash
pnpm test
```

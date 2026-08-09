# HireLens

HireLens is a focused AI-assisted job application workspace. It helps users manage resume groups and versions, create an application from a real job posting, analyze a resume against that job, track whether the application is pending/accepted/rejected, and keep AI-generated application documents in one library.

## Product Screens

- Dashboard
- Resumes
- Applications
- Saved Jobs
- AI Documents
- Settings

## Local Development

Use pnpm and run the app on port `5000`:

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env` and fill in the values before running database or AI/storage workflows.

## Scripts

```bash
pnpm typecheck
pnpm test
pnpm db:verify
pnpm build
pnpm start
```

## Deployment

`pnpm vercel-build` runs migration safety checks, applies Drizzle migrations, then builds Next.js.

## Security Notes

- Secrets stay server-side in `.env`.
- Browser routes use public UUIDs, not internal database IDs.
- Repository queries filter by authenticated `userId`.
- Resume PDFs are stored privately in Backblaze through S3-compatible signed URLs.
- Gemini is called only from server code.

Detailed implementation and interview notes live in `.claude/`.

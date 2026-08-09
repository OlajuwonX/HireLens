# HireLens Tradeoffs

## Gemini Over Client-Side AI

Gemini is called from server-only code so HireLens can validate output, enforce usage limits, and record provider activity. Client-side AI would be cheaper to prototype but would make quotas advisory and raw model responses harder to trust.

## Backblaze B2 Over Browser Storage

Resume PDFs and future generated PDFs use Backblaze B2 through the S3-compatible provider. Files stay private, metadata stays in Postgres, and reads go through short-lived signed URLs.

## Three Statuses Over Seven Stages

Applications use `PENDING`, `ACCEPTED`, and `REJECTED`. This keeps the product focused on outcomes rather than a complex CRM pipeline.

## Public UUIDs Over Internal IDs

URLs use public UUIDs. Internal database IDs remain server-side for joins and ownership checks.

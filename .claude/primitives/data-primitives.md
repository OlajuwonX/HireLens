# Data Primitives

Use Neon PostgreSQL for product data.

Every user-owned entity must include ownership and be protected server-side.

Required database entities:

- User
- Account
- Session
- VerificationToken
- Resume
- ResumeVersion
- FileAsset
- Job
- Application
- ApplicationActivity
- ResumeAnalysis
- RequirementMatch
- AnalysisSuggestion
- UserEvidenceCorrection
- GeneratedDocument
- AIUsageEvent
- AIUsageReservation
- UserPreference

Data rules:

- Use UUID/CUID-style public identifiers rather than sequential IDs in URLs.
- Add `createdAt` and `updatedAt`.
- Add explicit status fields.
- Use foreign keys and indexes.
- Use transactions for multi-record workflows.
- Store file metadata in the database, not file blobs.
- Store raw AI responses separately from normalized validated results.
- Store prompt version, model, provider, status, duration, and failure reason for analyses.

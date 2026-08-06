# Product Domain Primitives

HireLens is an AI-powered job application workspace, not a generic AI chat app and not a job-board scraper.

Core loop:

1. User signs in.
2. User uploads resumes.
3. User saves job opportunities manually.
4. User attaches a resume version to a job.
5. HireLens analyzes fit, ATS quality, missing requirements, and weak evidence.
6. User improves the resume and generates application documents.
7. User tracks the application through stages.
8. User learns from analytics.

Primary entities:

- User
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

Do not hard-code technology-career assumptions. HireLens must work for construction, healthcare, education, finance, hospitality, administration, legal, marketing, skilled trades, graduate roles, and other industries.

# HireLens Full Product Rebuild Prompt

You are rebuilding **HireLens**, an existing AI-assisted resume analysis project, into a production-quality, mobile-first job application preparation platform.

The current project is a React Router and Vite MVP that already supports:

- User authentication through Puter.
- PDF resume uploads.
- Resume file storage through Puter FS.
- Resume metadata storage through Puter KV.
- AI-powered resume analysis through Puter AI.
- ATS scoring.
- Resume quality scoring.
- Resume feedback and improvement recommendations.
- A basic resume dashboard.
- A detailed resume analysis page.

The rebuild must preserve the core working concepts while replacing the current application architecture with a secure, maintainable, full-stack Next.js application.

Do not merely redesign the existing screens. Rebuild HireLens around a proper product domain, secure server boundaries, reusable primitives, strong typing, accessible interactions, responsive layouts, and scalable feature architecture.

---

# 1. Product Vision

HireLens should become:

> An AI-powered job application workspace that helps users save job opportunities, analyze and tailor resumes, generate application documents, track applications, and understand what improves their chances of getting interviews.

HireLens is not a job-board aggregator.

It does not need to scrape or aggregate remote jobs in this version.

Users can manually save jobs that they find elsewhere and use HireLens to prepare stronger applications.

The primary product loop is:

1. User creates an account with Google.
2. User uploads one or more resumes.
3. User saves a job opportunity.
4. User attaches a resume version to the job.
5. HireLens analyzes the resume against the job description.
6. HireLens identifies strengths, gaps, missing keywords, and weak sections.
7. User generates a tailored cover letter or application message.
8. User moves the job into the application tracker.
9. User tracks application progress.
10. User reviews analytics showing what is working.

The product must work for all industries, not only technology roles.

Examples include:

- Software engineering
- Construction
- Quantity surveying
- Project management
- Healthcare
- Finance
- Education
- Administration
- Hospitality
- Legal services
- Marketing
- Creative work
- Skilled trades
- Entry-level roles
- Graduate roles

Avoid hard-coding technology-specific assumptions into prompts, schemas, UI labels, scoring logic, or recommended resume sections.

---

# 2. Required Technology Stack

Use the following stack:

- Next.js 15 App Router
- React
- TypeScript with strict mode
- pnpm
- Tailwind CSS
- Radix UI primitives or carefully selected shadcn/ui components
- Auth.js for authentication
- Google OAuth provider
- Neon PostgreSQL
- Prisma or Drizzle ORM
- Zod for validation
- TanStack Query for interactive server-state operations
- Zustand only for small client-side UI state
- Puter FS for resume file storage
- Puter AI for AI generation and analysis
- React Hook Form for complex forms
- Server Components by default
- Client Components only when browser interaction is required
- Next.js Route Handlers for backend APIs
- Next.js server-side cache revalidation where appropriate
- ESLint
- Prettier
- Vitest or Jest
- React Testing Library
- Playwright for important end-to-end flows

Use the latest stable patch release within Next.js 15.

Do not upgrade to Next.js 16.

Use pnpm for installation, scripts, workspace management, and lockfile generation.

Do not generate npm or Yarn lockfiles.

---

# 3. Core Product Features

## 3.1 Authentication and Account Creation

Replace Puter authentication with Auth.js and Google OAuth.

Required authentication functionality:

- Continue with Google.
- Create an application-owned user record.
- Sign in.
- Sign out.
- Secure session handling.
- Account settings.
- User profile display.
- Account deletion.
- Data deletion workflow.
- Last login tracking.
- Onboarding completion state.
- Session expiry handling.
- Unauthorized-session recovery.

Do not expose internal Auth.js account identifiers, provider IDs, session tokens, database IDs, or refresh tokens to the client unless absolutely necessary.

Use safe public user objects.

Example public user shape:

```ts
export type PublicUser = {
  name: string | null;
  email: string | null;
  image: string | null;
};
```

Do not return:

```ts
{
  (id, providerAccountId, accessToken, refreshToken, sessionToken);
}
```

All protected server operations must independently validate the authenticated session.

Do not trust a user ID supplied by the client.

Derive the current user from the server-side session.

---

## 3.2 Resume Library

Users must be able to:

- Upload a PDF resume.
- Give the resume a recognizable name.
- Store the PDF in Puter FS.
- Store resume metadata in Neon.
- Rename a resume.
- Archive a resume.
- Delete a resume.
- View resume details.
- Create multiple resume versions.
- Mark one resume version as the default.
- View upload and update dates.
- View analysis status.
- Retry a failed analysis.
- Compare resume versions.
- View score history.

Resume statuses:

```ts
export const RESUME_STATUSES = [
  "UPLOADING",
  "PROCESSING",
  "READY",
  "FAILED",
  "ARCHIVED",
] as const;
```

Resume file storage must remain behind an abstraction.

Do not call Puter FS directly from UI components.

Create a storage interface such as:

```ts
export interface StorageProvider {
  uploadResume(input: UploadResumeInput): Promise<StoredFile>;
  createReadUrl(storageKey: string): Promise<string>;
  deleteFile(storageKey: string): Promise<void>;
}
```

Implement:

```text
PuterStorageProvider
```

The rest of the application should depend on the interface, not Puter-specific functions.

---

## 3.3 Resume Analysis

Support two analysis modes:

### General resume audit

Analyze the resume without a target job.

Include:

- Overall resume score.
- ATS compatibility.
- Structure.
- Readability.
- Content quality.
- Achievement strength.
- Skills presentation.
- Summary quality.
- Experience quality.
- Education quality.
- Formatting warnings.
- Section recommendations.
- Improvement checklist.

### Job-specific analysis

Analyze a resume against a saved job.

Include:

- Overall job-fit score.
- Required-skills match.
- Preferred-skills match.
- Experience alignment.
- Education or certification alignment.
- Industry-language alignment.
- ATS keyword coverage.
- Responsibility alignment.
- Seniority alignment.
- Missing requirements.
- Weak evidence.
- Resume sections that should be rewritten.
- Keywords that should be added naturally.
- Potential overqualification or underqualification.
- Suggested resume section order.

Every analysis must be structured and validated.

Do not call `JSON.parse` directly on untrusted model output without normalization and validation.

Create a Zod schema for every AI response.

Example:

```ts
export const resumeAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
      problem: z.string(),
      reason: z.string(),
      action: z.string(),
    }),
  ),
});
```

Store:

- Raw AI response.
- Normalized result.
- AI provider.
- Model.
- Prompt version.
- Analysis type.
- Input hash.
- Creation time.
- Processing duration.
- Status.
- Failure reason where applicable.

Do not fabricate candidate experience, employers, achievements, dates, certifications, responsibilities, metrics, or qualifications.

When metrics would improve a resume bullet but are unavailable, generate placeholders such as:

```text
Improved page-load performance by [verified percentage].
```

Never invent the value.

---

## 3.4 Requirement Matrix

For job-specific analysis, create a requirement matrix.

Each requirement should contain:

```ts
export type RequirementMatch = {
  id: string;
  requirement: string;
  category:
    | "SKILL"
    | "EXPERIENCE"
    | "EDUCATION"
    | "CERTIFICATION"
    | "RESPONSIBILITY"
    | "LOCATION"
    | "OTHER";
  importance: "REQUIRED" | "PREFERRED";
  status: "STRONG" | "PARTIAL" | "MISSING" | "UNCLEAR";
  resumeEvidence: string | null;
  explanation: string;
  recommendation: string | null;
};
```

Allow the user to mark AI conclusions as incorrect.

Allow the user to add missing evidence manually.

This correction must be stored so that future analysis can account for verified user-provided evidence.

---

## 3.5 Saved Jobs

Users must be able to save job opportunities manually.

Job fields:

- Job title
- Company
- Location
- Work arrangement
- Employment type
- Salary range
- Currency
- Job source
- Source URL
- Job description
- Requirements
- Application deadline
- Personal notes
- Date saved
- Status
- Archived state

Supported work arrangements:

```text
Remote
Hybrid
On-site
Not specified
```

Supported employment types:

```text
Full-time
Part-time
Contract
Internship
Temporary
Freelance
Not specified
```

Saved-job actions:

- Create.
- Edit.
- Duplicate.
- Archive.
- Delete.
- Analyze against a resume.
- Generate application documents.
- Convert to an application.
- Attach a deadline.
- Attach notes.
- Attach a selected resume version.

The job-description field must support long text comfortably on mobile and desktop.

Use autosizing text areas where appropriate.

Never render untrusted job descriptions with unsafe HTML.

Treat job descriptions as plain text unless sanitized using a proven sanitizer.

---

## 3.6 Application Tracker

Applications should move through the following stages:

```ts
export const APPLICATION_STAGES = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;
```

Each application must reference:

- User
- Job
- Resume version used
- Analysis used
- Cover letter used
- Current stage
- Date applied
- Follow-up date
- Interview date
- Notes
- Last activity
- Created date
- Updated date

Support:

- Table view.
- Compact mobile list.
- Optional pipeline view.
- Filtering.
- Sorting.
- Searching.
- Stage updates.
- Notes.
- Follow-up reminders displayed inside the dashboard.
- Timeline of application activity.

Do not build complicated drag-and-drop interactions as the only way to update stages.

Every action must also be available through accessible buttons, menus, or select controls.

---

## 3.7 AI Application Studio

Create an AI document studio associated with saved jobs and applications.

Supported document types:

- Tailored cover letter.
- Application email.
- Email subject suggestions.
- Recruiter LinkedIn message.
- Follow-up email.
- Interview thank-you email.
- Short professional introduction.
- Career-change explanation.
- Entry-level application note.

Store generated documents in Neon.

Generated documents must remain editable.

Each generated document should store:

- Document type.
- Job ID.
- Application ID where applicable.
- Resume version ID.
- Prompt version.
- Original generated content.
- Edited content.
- Created time.
- Updated time.

Cover-letter options:

- Standard professional.
- Concise.
- Achievement-led.
- Entry-level.
- Career-change.
- Internal application.

Do not generate generic filler such as:

```text
I am writing to express my strong interest...
```

unless the selected tone intentionally requires traditional wording.

Use specific evidence from the selected resume and job description.

Do not invent experience.

---

## 3.8 Follow-Up Templates

Provide reusable templates for:

- Following up after applying.
- Following up after an interview.
- Thanking an interviewer.
- Responding to a recruiter.
- Asking for an application update.
- Confirming interview availability.
- Withdrawing an application professionally.

Templates should be generated using known job and user context.

Allow users to:

- Preview.
- Edit.
- Copy.
- Save.
- Regenerate.
- Select tone.
- Select length.

Supported tones:

```text
Professional
Warm
Direct
Concise
Confident
```

---

## 3.9 Analytics

Analytics should be useful, clean, calm, and easy to read.

Do not create a dashboard full of decorative charts.

Analytics should include:

- Total saved jobs.
- Active applications.
- Applications this month.
- Interviews received.
- Offers received.
- Applications requiring follow-up.
- Average resume score.
- Average ATS score.
- Average job-fit score.
- Application stage distribution.
- Monthly application activity.
- Most common missing skills.
- Most common missing requirements.
- Best-performing resume version.
- Resume score changes over time.
- Interview rate by resume version where enough data exists.

Use accessible chart components.

Charts must include:

- Text alternatives.
- Tooltips.
- Labels.
- Keyboard accessibility where supported.
- Data summaries outside the chart.
- Proper contrast.
- No dependency on colour alone.

Mobile analytics must not force desktop charts into tiny containers.

On small screens:

- Use summary cards.
- Convert dense charts into scrollable or simplified views.
- Provide a “View data table” option.
- Avoid horizontal page overflow.

---

# 4. AI Rate Limiting and Usage Protection

Every AI action must be protected server-side.

Do not rely on frontend counters.

Apply two forms of limiting.

## Burst rate limits

Suggested initial limits:

```text
Maximum 3 AI requests per minute per user.
Maximum 1 active AI request per user.
```

## Daily usage quotas

Suggested initial allowances:

```text
General resume analyses: 5 per day.
Job-fit analyses: 10 per day.
Cover letters: 5 per day.
Follow-up and communication documents: 15 per day.
```

Make the limits configurable through environment variables or application configuration.

Create an AI usage service.

Suggested primitives:

```ts
export interface AIUsageService {
  checkAllowance(input: CheckAllowanceInput): Promise<AllowanceResult>;
  reserveUsage(input: ReserveUsageInput): Promise<UsageReservation>;
  completeUsage(input: CompleteUsageInput): Promise<void>;
  failUsage(input: FailUsageInput): Promise<void>;
}
```

Before an AI request:

1. Validate the server-side session.
2. Validate input with Zod.
3. Check ownership of referenced resources.
4. Check burst limit.
5. Check daily quota.
6. Check concurrency lock.
7. Generate an input hash.
8. Check for an existing identical successful result.
9. Reserve usage.
10. Call Puter AI.
11. Validate the output.
12. Store normalized and raw output.
13. Complete the usage record.
14. Release the concurrency lock.
15. Revalidate affected server data.

Do not count requests that fail before reaching the AI provider.

Requests that successfully reach the provider should count, even if the model output later fails schema validation.

This prevents users from intentionally causing retries to bypass limits.

Display usage clearly:

```text
Resume analyses: 3 of 5 used
Job-fit analyses: 4 of 10 used
Cover letters: 2 of 5 used
Resets tomorrow
```

Do not expose global system capacity or other users’ usage.

---

# 5. Database Architecture

Use Neon PostgreSQL.

Create a normalized relational data model.

Required entities:

```text
User
Account
Session
VerificationToken

Resume
ResumeVersion
FileAsset

Job
Application
ApplicationActivity

ResumeAnalysis
RequirementMatch
AnalysisSuggestion
UserEvidenceCorrection

GeneratedDocument

AIUsageEvent
AIUsageReservation

UserPreference
```

Recommended relationships:

```text
User
 ├── Resumes
 │    └── ResumeVersions
 │         └── ResumeAnalyses
 │              ├── RequirementMatches
 │              └── AnalysisSuggestions
 │
 ├── Jobs
 │    └── Applications
 │         ├── ApplicationActivities
 │         └── GeneratedDocuments
 │
 └── AIUsageEvents
```

Every user-owned record must include a user ownership relationship.

Use database constraints where possible.

Use:

- Foreign keys.
- Unique indexes.
- Composite indexes.
- Created timestamps.
- Updated timestamps.
- Soft-delete fields only where recovery is genuinely required.
- Explicit status fields.
- Cascading deletion only after carefully reviewing privacy and recovery behaviour.

Recommended indexes include:

- User ID and creation date.
- User ID and status.
- Application stage and user ID.
- Job title and company search fields.
- Resume analysis input hash.
- AI usage user ID, action type, and date.
- Resume version parent ID.
- Follow-up date.

Do not expose sequential database IDs in public URLs if avoidable.

Use UUIDs, CUIDs, or similarly non-sequential public identifiers.

---

# 6. API and Server Architecture

Use Next.js Route Handlers for APIs.

Group APIs by domain.

Example:

```text
app/api/
  auth/
  resumes/
  resumes/[resumeId]/
  resumes/[resumeId]/versions/
  analyses/
  analyses/[analysisId]/
  jobs/
  jobs/[jobId]/
  applications/
  applications/[applicationId]/
  documents/
  analytics/
  usage/
```

Do not place all application logic inside Route Handlers.

Route Handlers should:

1. Authenticate.
2. Parse input.
3. Validate input.
4. Call a domain service.
5. Map the result into a safe response.
6. Return a consistent response shape.

Create service-layer files.

Example:

```text
features/resumes/server/resume.service.ts
features/jobs/server/job.service.ts
features/applications/server/application.service.ts
features/analyses/server/analysis.service.ts
features/documents/server/document.service.ts
features/analytics/server/analytics.service.ts
features/usage/server/usage.service.ts
```

Create repository files where database logic becomes complex.

Example:

```text
features/resumes/server/resume.repository.ts
features/jobs/server/job.repository.ts
```

Do not allow React components to import database clients.

Do not allow client components to import server-only files.

Add `server-only` imports where appropriate.

---

# 7. Validation

Use Zod at every untrusted boundary.

Validate:

- Route parameters.
- Query parameters.
- Request bodies.
- Form submissions.
- Environment variables.
- AI responses.
- Uploaded file metadata.
- User preferences.
- Pagination.
- Sorting.
- Filtering.
- Date input.
- URLs.
- Enum values.

Create schemas close to their domain.

Example:

```text
features/jobs/schemas/create-job.schema.ts
features/jobs/schemas/update-job.schema.ts
features/jobs/schemas/job-filter.schema.ts
features/analyses/schemas/resume-analysis.schema.ts
```

Derive TypeScript types from Zod schemas whenever practical:

```ts
export type CreateJobInput = z.infer<typeof createJobSchema>;
```

Do not maintain manually duplicated interfaces that can drift from validation schemas.

Use safe error messages.

Do not return raw database, AI provider, OAuth, stack trace, or storage errors to clients.

---

# 8. Primitive and Component Architecture

Create low-level UI primitives separately from feature components.

Suggested structure:

```text
components/
  ui/
    button.tsx
    input.tsx
    textarea.tsx
    select.tsx
    checkbox.tsx
    radio-group.tsx
    dialog.tsx
    sheet.tsx
    dropdown-menu.tsx
    tooltip.tsx
    tabs.tsx
    table.tsx
    card.tsx
    badge.tsx
    avatar.tsx
    skeleton.tsx
    separator.tsx
    progress.tsx
    alert.tsx
    toast.tsx
    empty-state.tsx
    error-state.tsx
    loading-state.tsx
    pagination.tsx
    search-input.tsx
    date-picker.tsx
    file-dropzone.tsx
    score-ring.tsx
    chart-container.tsx
    accessible-icon-button.tsx
```

Create layout primitives:

```text
components/layout/
  app-shell.tsx
  dashboard-sidebar.tsx
  dashboard-header.tsx
  mobile-navigation.tsx
  page-header.tsx
  page-container.tsx
  section.tsx
  responsive-grid.tsx
  details-panel.tsx
```

Create data-display primitives:

```text
components/data-display/
  metric-card.tsx
  status-badge.tsx
  score-card.tsx
  data-table.tsx
  mobile-data-list.tsx
  timeline.tsx
  activity-item.tsx
  requirement-status.tsx
  usage-meter.tsx
```

Feature components must live inside their domains:

```text
features/
  resumes/
    components/
    hooks/
    schemas/
    server/
    types/
    constants/
    utils/

  jobs/
    components/
    hooks/
    schemas/
    server/
    types/

  applications/
  analyses/
  documents/
  analytics/
  usage/
```

Do not create a single global `utils.ts` file containing unrelated functions.

Use focused files such as:

```text
format-score.ts
format-date.ts
calculate-usage.ts
normalize-ai-response.ts
hash-analysis-input.ts
```

---

# 9. Suggested Full Folder Structure

```text
hirelens/
├── .claude/
│   ├── project/
│   │   ├── overview.md
│   │   ├── architecture.md
│   │   ├── product-domain.md
│   │   ├── data-model.md
│   │   ├── authentication.md
│   │   ├── ai-system.md
│   │   ├── storage-system.md
│   │   ├── security.md
│   │   ├── performance.md
│   │   ├── accessibility.md
│   │   └── decisions.md
│   │
│   └── interview-prep/
│       ├── README.md
│       ├── project-story.md
│       ├── architecture-questions.md
│       ├── nextjs-questions.md
│       ├── authentication-questions.md
│       ├── database-questions.md
│       ├── ai-integration-questions.md
│       ├── security-questions.md
│       ├── performance-questions.md
│       ├── accessibility-questions.md
│       ├── testing-questions.md
│       ├── tradeoffs.md
│       └── mock-interview.md
│
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── not-found.tsx
│   └── loading.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── data-display/
│   └── feedback/
│
├── features/
│   ├── auth/
│   ├── resumes/
│   ├── jobs/
│   ├── applications/
│   ├── analyses/
│   ├── documents/
│   ├── analytics/
│   └── usage/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── ai/
│   ├── storage/
│   ├── rate-limit/
│   ├── permissions/
│   ├── validation/
│   ├── cache/
│   ├── errors/
│   ├── logging/
│   └── env/
│
├── prisma-or-drizzle/
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── pnpm-lock.yaml
└── README.md
```

---

# 10. `.claude/project` Documentation

Create documentation that explains the application to future AI coding agents.

Each file must be concise but detailed enough to prevent architectural drift.

## `overview.md`

Explain:

- What HireLens is.
- Who it is for.
- Core product loop.
- Features included.
- Features intentionally excluded.
- Current technical stack.

## `architecture.md`

Explain:

- App Router structure.
- Server and client boundaries.
- Feature-based organization.
- Service and repository layers.
- Data flow.
- Caching strategy.
- Error handling.
- External provider abstractions.

## `product-domain.md`

Define:

- Resume.
- Resume version.
- Saved job.
- Application.
- Analysis.
- Requirement match.
- Generated document.
- Usage event.

## `data-model.md`

Explain:

- Entities.
- Relationships.
- Ownership rules.
- Indexes.
- Deletion behaviour.
- Why files are not stored in Postgres.

## `authentication.md`

Explain:

- Auth.js.
- Google OAuth.
- Session strategy.
- Public user objects.
- Server-side authorization.
- Account deletion.

## `ai-system.md`

Explain:

- Puter AI abstraction.
- Prompt versioning.
- Structured-output validation.
- Rate limiting.
- Usage quotas.
- Duplicate-request caching.
- Truthfulness requirements.

## `storage-system.md`

Explain:

- Puter FS provider.
- Storage abstraction.
- File metadata.
- Signed or controlled access.
- File deletion.
- Future provider migration.

## `security.md`

Explain:

- Threat model.
- Authorization.
- Input validation.
- File validation.
- Rate limits.
- Sensitive-data protection.
- Logging restrictions.
- Error response safety.

## `performance.md`

Explain:

- Server Components.
- TanStack Query.
- Revalidation.
- Memoization.
- Lazy loading.
- Bundle control.
- Image optimization.
- PDF preview loading.
- Chart loading.
- Mobile performance.

## `accessibility.md`

Explain:

- WCAG target.
- Keyboard navigation.
- Focus handling.
- ARIA use.
- Form labelling.
- Chart accessibility.
- Reduced motion.
- Error announcements.
- Modal behaviour.

## `decisions.md`

Maintain architecture decision records.

For each major decision, include:

```text
Decision
Context
Options considered
Chosen approach
Reason
Trade-offs
Future migration path
```

---

# 11. `.claude/interview-prep` Folder

Create a dedicated interview-preparation folder that teaches the project owner how to explain HireLens during interviews.

The content must not be generic.

It must be based on the actual HireLens architecture.

## `project-story.md`

Explain the project using:

- Problem.
- User.
- Original MVP.
- Limitations discovered.
- Rebuild goals.
- Architecture.
- Difficult technical decisions.
- Security considerations.
- Performance considerations.
- Product impact.
- Future improvements.

Include:

- 30-second explanation.
- 60-second explanation.
- 2-minute explanation.
- Deep technical explanation.

## `architecture-questions.md`

Include likely questions and strong answers:

- Why Next.js App Router?
- Why use Server Components?
- Why keep some components client-side?
- Why feature-based folders?
- Why use service and repository layers?
- Why not call the database directly from Route Handlers?
- Why abstract Puter?
- How is stale data handled?
- How does ownership enforcement work?

## `nextjs-questions.md`

Cover:

- Server Components.
- Client Components.
- Route Handlers.
- Cache revalidation.
- Dynamic rendering.
- Loading boundaries.
- Error boundaries.
- Streaming.
- Metadata.
- Middleware.
- Server-only modules.

## `authentication-questions.md`

Cover:

- OAuth flow.
- Google authentication.
- Sessions.
- CSRF considerations.
- Secure cookies.
- Server-side authorization.
- Why hiding a UI element is not authorization.
- Account linking.
- Data deletion.

## `database-questions.md`

Cover:

- Why PostgreSQL?
- Why Neon?
- Relationships.
- Indexes.
- Transactions.
- N+1 queries.
- Pagination.
- Soft versus hard deletion.
- Resume versioning.
- Application history.
- Usage reservations.

## `ai-integration-questions.md`

Cover:

- Structured AI outputs.
- Zod validation.
- Prompt versioning.
- Hallucination control.
- Duplicate-request hashing.
- Usage quotas.
- Retry handling.
- Provider abstraction.
- Raw versus normalized output.
- Why AI responses are never trusted directly.

## `security-questions.md`

Cover:

- Broken object-level authorization.
- File upload validation.
- Sensitive resume data.
- Rate limiting.
- Prompt injection.
- Error leakage.
- Secure logging.
- Session validation.
- Ownership queries.
- API abuse prevention.

## `performance-questions.md`

Cover:

- Server rendering.
- Client caching.
- Query invalidation.
- Memoization.
- Dynamic imports.
- Bundle size.
- Image and PDF loading.
- Database indexing.
- Avoiding unnecessary renders.
- Measuring before optimizing.

## `accessibility-questions.md`

Cover:

- Semantic HTML.
- Keyboard navigation.
- ARIA.
- Focus trapping.
- Screen-reader announcements.
- Form errors.
- Colour contrast.
- Reduced motion.
- Responsive data tables.
- Accessible charts.

## `tradeoffs.md`

Document real trade-offs:

- Puter versus owned storage.
- Puter AI versus paid AI providers.
- Auth.js versus managed auth SaaS.
- TanStack Query versus Server Components.
- Prisma versus Drizzle.
- Vercel Hobby limits.
- Free infrastructure versus production scale.
- Manual job saving versus browser extension.
- Simpler analytics versus advanced event pipelines.

## `mock-interview.md`

Create at least 40 project-specific interview questions with:

- Concise answer.
- Strong expanded answer.
- Possible follow-up.
- Common weak answer to avoid.

---

# 12. Responsive and Mobile-First Requirements

Design mobile-first.

Start from widths around 320px and scale upward.

Test at:

```text
320px
360px
375px
390px
414px
768px
1024px
1280px
1440px
```

Required mobile behaviour:

- Sidebar becomes a full-height mobile navigation sheet.
- Navigation must not obscure content.
- Tables become accessible lists or scrollable containers.
- Forms use single-column layouts.
- Multi-column dashboards collapse logically.
- Buttons remain thumb-friendly.
- Minimum interactive target should be approximately 44 by 44 pixels where practical.
- Avoid tiny icon-only actions without labels or accessible names.
- Dialogs should become bottom sheets or full-screen panels where appropriate.
- PDF previews should not force the page wider than the viewport.
- Charts should simplify on smaller screens.
- Long job titles must wrap safely.
- Long company names must not break card layouts.
- Cards must not rely on fixed heights.
- Forms must remain usable with the mobile keyboard open.
- Sticky elements must respect safe areas.
- Loading states must preserve layout stability.

Do not use arbitrary desktop breakpoints without testing intermediate widths.

Avoid horizontal overflow.

Use CSS grid and flexbox carefully.

Use container queries only where they offer measurable value.

---

# 13. Dashboard Design Direction

The interface should feel like a professional productivity application.

Avoid:

- Heavy particle backgrounds.
- Excessive gradients.
- Huge rounded cards.
- Decorative animation everywhere.
- Glassmorphism across all surfaces.
- Oversized empty spacing.
- Bright colours without meaning.
- Dense dashboards filled with charts.
- Generic AI sparkle icons on every action.

Use:

- Calm neutral background.
- Clear surfaces.
- One primary brand colour.
- Consistent spacing.
- Strong typography.
- Small and medium border radii.
- Restrained shadows.
- Clear information hierarchy.
- Compact but comfortable controls.
- Consistent status colours.
- Purposeful motion.
- Meaningful empty states.

Dashboard navigation:

```text
Overview
Saved Jobs
Applications
Resumes
AI Documents
Analytics
Settings
```

Overview should show:

- Active applications.
- Saved jobs.
- Follow-ups due.
- Average job-fit score.
- Recent applications.
- Recent resumes.
- Usage allowance.
- Most important next action.

Do not repeat every metric on every page.

---

# 14. Accessibility and WCAG

Target WCAG 2.2 AA where practical.

Requirements:

- Use semantic landmarks.
- Include a skip-to-content link.
- Use one clear page-level `h1`.
- Maintain logical heading order.
- Associate labels with inputs.
- Use `aria-describedby` for help and error text.
- Use `aria-invalid` for invalid fields.
- Use `aria-live` for asynchronous status messages.
- Use `aria-busy` during processing.
- Use accessible names for icon-only controls.
- Use `aria-expanded` and `aria-controls` for collapsible controls.
- Ensure dialogs have accessible titles and descriptions.
- Trap focus correctly in dialogs.
- Restore focus after dialogs close.
- Support complete keyboard navigation.
- Do not use colour as the only status indicator.
- Respect `prefers-reduced-motion`.
- Provide visible focus indicators.
- Ensure sufficient contrast.
- Announce upload progress and AI analysis status.
- Provide accessible alternatives to charts.
- Avoid unnecessary ARIA where native HTML already provides correct semantics.

Use native elements before custom roles.

Prefer:

```html
<button></button>
```

over:

```html
<div role="button"></div>
```

---

# 15. Performance Requirements

The application must feel fast on mobile networks and average devices.

Use Server Components by default.

Avoid marking entire routes with `"use client"`.

Performance requirements:

- Keep the initial client bundle small.
- Dynamically import heavy PDF and chart libraries.
- Load PDF previews only when needed.
- Avoid loading complete PDF documents on dashboard cards.
- Generate lightweight preview images where appropriate.
- Use skeletons that match final layouts.
- Avoid layout shifts.
- Paginate large resume, job, and application lists.
- Debounce search inputs.
- Use database indexes.
- Select only required database fields.
- Avoid N+1 queries.
- Use TanStack Query only where client caching is valuable.
- Set intentional `staleTime`.
- Invalidate only affected queries.
- Use server-side revalidation after mutations.
- Cache identical analysis inputs.
- Use React memoization only where profiling shows repeated rendering.
- Do not blanket the project with `useMemo`, `useCallback`, or `memo`.
- Compress icons and static assets.
- Use `next/image` where applicable.
- Avoid large animation libraries unless necessary.
- Respect reduced-motion settings.
- Split analytics charts from the initial dashboard bundle.
- Avoid rendering hidden desktop and mobile versions simultaneously when expensive.

Measure:

- Largest Contentful Paint.
- Interaction to Next Paint.
- Cumulative Layout Shift.
- First Contentful Paint.
- JavaScript bundle size.
- Route transition speed.
- API latency.
- Database query duration.
- AI analysis duration.

Create a performance budget.

Suggested targets:

```text
Marketing landing page LCP: under 2.5 seconds on a reasonable mobile connection.
Dashboard shell: visible quickly with progressive loading.
No unexpected horizontal overflow.
Minimal layout shift.
No large chart or PDF library in the initial dashboard bundle.
```

---

# 16. TanStack Query and Server Data Strategy

Do not use TanStack Query for every server fetch.

Use Server Components for:

- Initial dashboard data.
- Resume details.
- Job details.
- Application details.
- Analytics summaries.
- User profile and plan data.

Use TanStack Query for:

- Interactive filtering.
- Search.
- Pagination.
- Optimistic application-stage updates.
- Analysis polling.
- Retry actions.
- Mutations inside dialogs.
- Background refresh.
- Usage-meter refresh.
- Client-side workflows that should not refresh the whole route.

Create query-key factories.

Example:

```ts
export const jobKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobKeys.all, "list"] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, "detail"] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};
```

Do not scatter query-key strings throughout components.

After server mutations:

- Revalidate affected Next.js paths or tags.
- Invalidate affected TanStack Query keys where client state is active.
- Avoid full-page reloads unless required.

---

# 17. Security Requirements

Security must be treated as part of the architecture.

## Authentication and authorization

- Validate sessions on the server.
- Check resource ownership for every protected operation.
- Never trust client-provided user IDs.
- Avoid exposing database records directly.
- Map server entities to safe DTOs.
- Protect APIs even when the page itself is protected.
- Apply least privilege.

## Input security

- Validate all data with Zod.
- Limit field lengths.
- Validate URLs.
- Normalize strings.
- Reject unexpected object properties where practical.
- Sanitize user-generated rich text if rich text is ever introduced.

## File upload security

- Allow PDF only initially.
- Validate extension.
- Validate MIME type.
- Inspect file signature where practical.
- Enforce file-size limits.
- Generate safe storage keys.
- Do not trust original filenames.
- Store original filenames only as metadata.
- Do not expose permanent public file URLs.
- Delete files when associated records are deleted.

## AI security

- Treat job descriptions and resumes as untrusted inputs.
- Separate user content from system instructions.
- Warn the model not to obey instructions embedded in uploaded content.
- Validate every output.
- Apply usage limits.
- Cache duplicate analyses.
- Limit concurrency.
- Store provider failures safely.
- Do not leak prompts containing private user information into logs.

## Logging

Never log:

- Full resumes.
- Full job descriptions.
- Cover letters.
- OAuth tokens.
- Session tokens.
- Sensitive user profile data.
- Raw file contents.

Use structured logs with safe identifiers.

## Error handling

Create typed application errors:

```text
UnauthorizedError
ForbiddenError
NotFoundError
ValidationError
ConflictError
RateLimitError
UsageLimitError
StorageError
AIProviderError
```

Map them to safe HTTP responses.

Do not return stack traces in production.

---

# 18. Error and Loading Experience

Create reusable states:

- Page loading.
- Section loading.
- Empty state.
- Recoverable error.
- Fatal error.
- Offline state.
- Analysis processing.
- Analysis failed.
- Upload failed.
- Rate limit reached.
- Usage limit reached.
- Session expired.

Every async action must provide:

- Visible progress.
- Disabled state when necessary.
- Accessible status announcement.
- Clear retry path.
- Clear success confirmation.

Do not use browser `alert()`.

Use reusable toast and inline feedback components.

---

# 19. Testing Requirements

Create unit tests for:

- Zod schemas.
- Score normalization.
- AI output normalization.
- Input hashing.
- Usage calculations.
- Rate-limit decisions.
- Permission checks.
- Date helpers.
- Analytics calculations.

Create integration tests for:

- Creating a saved job.
- Uploading resume metadata.
- Creating resume versions.
- Running analysis.
- Reserving and completing AI usage.
- Preventing access to another user’s resource.
- Generating documents.
- Updating application stages.

Create Playwright flows for:

1. Google-authenticated user enters dashboard.
2. User uploads a resume.
3. User saves a job.
4. User analyzes a resume against a job.
5. User views requirement gaps.
6. User generates a cover letter.
7. User converts the saved job to an application.
8. User updates the application stage.
9. User views analytics.
10. Unauthorized access is blocked.

Mock external providers in automated tests.

Do not call Puter AI during normal test runs.

---

# 20. Environment Variables

Validate environment variables with Zod.

Create:

```text
lib/env/server.ts
lib/env/client.ts
```

Only expose variables prefixed with `NEXT_PUBLIC_` when the browser genuinely needs them.

Server variables may include:

```text
DATABASE_URL
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
PUTER_CONFIGURATION
AI_RATE_LIMIT_PER_MINUTE
AI_GENERAL_ANALYSIS_DAILY_LIMIT
AI_JOB_ANALYSIS_DAILY_LIMIT
AI_COVER_LETTER_DAILY_LIMIT
AI_MESSAGE_DAILY_LIMIT
```

Do not expose database, OAuth, AI, or storage secrets to client bundles.

---

# 21. README Requirements

Replace template README content.

Document:

- Product overview.
- Screenshots later.
- Stack.
- Architecture.
- Local setup.
- Environment variables.
- Database migration.
- Development commands.
- Testing.
- Authentication setup.
- Puter setup.
- Deployment.
- Security notes.
- Known limitations.
- Future browser-extension direction.
- Interview-prep documentation location.

Use pnpm commands only.

---

# 22. Deployment Direction

The initial project should remain deployable using free tiers.

Recommended initial deployment:

- Application and API: Vercel Hobby.
- Database: Neon free tier.
- Authentication: Auth.js and Google OAuth.
- File storage: Puter FS.
- AI: Puter AI.

Do not tightly couple the architecture to free-tier limitations.

Create provider abstractions so storage and AI can be replaced later.

The application should gracefully handle:

- Provider outages.
- Free-tier sleeping or cold starts.
- AI quota exhaustion.
- Database connection failures.
- File-storage failures.
- Slow analysis responses.

---

# 23. Implementation Principles

Follow these principles throughout the rebuild:

1. Server Components by default.
2. Client Components only when required.
3. Validate all untrusted input.
4. Authorize every protected resource.
5. Derive types from schemas where practical.
6. Keep external providers behind interfaces.
7. Keep business logic out of React components.
8. Keep database access out of client code.
9. Keep Route Handlers thin.
10. Avoid duplicated types.
11. Avoid generic utility dumping grounds.
12. Avoid premature abstraction.
13. Avoid premature memoization.
14. Optimize based on measurable cost.
15. Design mobile-first.
16. Preserve accessibility through every interaction.
17. Never invent resume details.
18. Never expose private user information unnecessarily.
19. Keep analytics useful rather than decorative.
20. Document architectural decisions.

---

# 24. Completion Criteria

The rebuild is complete when:

- Users can create accounts using Google.
- Authentication is server-validated.
- Protected resources use ownership checks.
- Users can upload and manage resumes.
- Resume files are stored through Puter FS abstraction.
- Metadata and product records are stored in Neon.
- Users can create resume versions.
- Users can save jobs.
- Users can analyze resumes generally and against jobs.
- AI responses are Zod validated.
- Users can see requirement gaps.
- Users can generate cover letters and follow-up messages.
- Users can convert saved jobs into applications.
- Applications can be tracked by stage.
- Analytics provide useful application and resume insights.
- AI rate limits and daily quotas are enforced server-side.
- Duplicate AI analysis is cached.
- The interface works from 320px mobile screens through large desktops.
- Accessibility requirements are implemented.
- Heavy libraries are lazy-loaded.
- No sensitive credentials reach the browser.
- No user can access another user’s records.
- Tests cover critical workflows.
- `.claude/project` documentation explains the architecture.
- `.claude/interview-prep` prepares the project owner to explain technical decisions in interviews.
- The README accurately documents the project.
- The application deploys successfully using the intended free-tier infrastructure.

---

# 25. Final Product Statement

HireLens should ultimately be presented as:

> HireLens is a full-stack AI job-application workspace built with Next.js, TypeScript, Neon PostgreSQL, Auth.js, Puter storage, and structured AI workflows. It helps users save jobs, analyze and version resumes, identify requirement gaps, generate truthful application documents, track applications, and measure which strategies improve their job-search results.

Build it as a credible product, not a UI demonstration.

Prioritize security, maintainability, performance, accessibility, responsive behaviour, and a clear product workflow over feature quantity.

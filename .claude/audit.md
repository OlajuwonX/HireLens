# HireLens Application Audit

Date: August 6, 2026

## Executive Summary

HireLens is currently a resume analysis MVP built with React Router, React 19, Tailwind CSS, Zustand, PDF.js, and Puter. The application lets an authenticated user upload a PDF resume, add company/job context, convert the first PDF page into an image preview, store resume metadata and files through Puter, ask an AI model for structured resume feedback, and view the resulting resume score, ATS score, and improvement tips.

The strongest thing in the project is that it already has the core resume SaaS workflow: authentication, file upload, resume parsing/preview, AI feedback, persistent resume records, and a review dashboard. That gives this project a real product base. To transform it into a SaaS, the next step is not a full rewrite; it is to harden the current MVP, add a proper product data model, introduce paid limits and user plans, and build resume-centered workflows on top of the analysis engine.

## What The Application Does Today

The current user journey is:

1. User lands on `/`.
2. If unauthenticated, the app redirects the user to `/auth?next=/`.
3. User logs in with Puter auth.
4. Home loads saved resume records from Puter KV using the `resume:*` key pattern.
5. User goes to `/upload`.
6. User enters company name, job title, job description, and uploads a PDF resume.
7. The app uploads the PDF to Puter FS.
8. The app converts the first PDF page to a PNG image using PDF.js.
9. The app uploads the generated image to Puter FS.
10. The app stores a resume metadata record in Puter KV.
11. The app sends the PDF and job context to Puter AI using a structured prompt.
12. The app parses the AI response as JSON and stores the feedback in KV.
13. User is redirected to `/resume/:id`.
14. The resume page displays the resume preview, overall score, ATS score, category scores, and detailed tips.

Routes:

- `/` shows the authenticated resume dashboard.
- `/auth` handles login/logout.
- `/upload` handles resume upload and analysis.
- `/resume/:id` shows the detailed resume review.

## Current Product Position

HireLens is best described as an AI resume review and application tracking MVP.

It is not yet a full SaaS because it does not currently have:

- Subscription plans or payments.
- A durable backend database under the app owner's control.
- Organization/team accounts.
- Admin tools.
- Usage quotas.
- Server-side authorization.
- Email flows.
- Production observability.
- A formal resume/job/application domain model.
- A repeatable onboarding, account, or billing experience.

However, it already has enough product surface to grow into a resume-focused SaaS without discarding the current work.

## Technology Stack

Frontend and app framework:

- React 19
- React Router 7
- TypeScript
- Vite
- Tailwind CSS 4
- DaisyUI
- Zustand for client state

Resume and file handling:

- `react-dropzone` for PDF upload
- `pdfjs-dist` for PDF-to-image conversion
- Puter FS for file storage
- Puter KV for lightweight persistence

AI:

- Puter AI chat
- Current feedback model option is set to `claude-3-7-sonnet` in `app/lib/puter.ts`
- Structured prompt defined in `constants/index.ts`

Visual/UI libraries:

- Tailwind utility classes
- Radix Accordion
- Framer Motion / Motion
- GSAP
- OGL particle background
- Tabler and Lucide icon packages are installed, though the current UI mostly uses image SVG files from `public/icon`

Verification:

- `npm run typecheck` passes.

## Authentication Audit

Current implementation:

- Auth is handled entirely through Puter.
- Global auth state lives in `usePuterStore` in `app/lib/puter.ts`.
- The root layout loads `https://js.puter.com/v2/` and calls `init()`.
- `init()` waits for Puter to become available, then checks auth status.
- Protected routes redirect unauthenticated users to `/auth`.

Strengths:

- Auth exists and is already integrated into the primary flow.
- The store exposes sign in, sign out, refresh user, and auth status checks.
- The app has route-level protection for home and resume pages.

Risks and corrections:

- `/upload` does not currently guard unauthenticated users, even though it uses authenticated Puter FS/KV/AI functionality.
- Home redirects before auth loading is complete. On page refresh, `auth.isAuthenticated` starts false and can send users to `/auth` before Puter finishes checking the session.
- `/auth` parses the `next` URL with `location.search.split('next=')[1]`, which is brittle and does not decode URL encoding.
- `navigate(next)` can receive `undefined`, which may behave badly when an authenticated user visits `/auth` without a `next` parameter.
- There is no server-side protection. All auth checks are client-side.
- There is no app-owned user profile record, onboarding state, role, plan, or usage counter.

Recommended auth direction for SaaS:

- Keep Puter auth temporarily for the MVP if speed matters.
- Add an app-owned user profile model with fields like `id`, `puterUserId`, `email`, `name`, `plan`, `createdAt`, `lastLoginAt`.
- Add a shared route guard pattern that waits for `isLoading === false` before redirecting.
- Use `URLSearchParams` for `next`.
- Add an account/settings page.
- Add usage limits by plan: free users get a small number of resume scans, paid users get more scans and premium tools.
- Long term, consider moving auth and persistence to a SaaS-grade backend stack such as Supabase, Clerk + Postgres, Auth.js + Postgres, or another system the business controls.

## Data And Persistence Audit

Current data storage:

- Resume files are stored in Puter FS.
- Resume images are stored in Puter FS.
- Resume metadata is stored in Puter KV under keys like `resume:${uuid}`.
- Each record currently contains `id`, `resumePath`, `imagePath`, `companyName`, `jobTitle`, `jobDescription`, and `feedback`.

Strengths:

- The project already persists user-created resume records.
- The current storage flow is simple and easy to build on.
- File and metadata storage are separated clearly.

Risks:

- Puter KV is not a relational product database.
- There is no schema migration strategy.
- There are no created/updated timestamps.
- There is no explicit user ID stored on resume records.
- There is no record status field such as `uploaded`, `analyzing`, `complete`, or `failed`.
- Failed analysis can leave partially created records.
- No delete flow exists for removing uploaded resumes and generated images.
- No retry flow exists for failed AI analysis.
- No privacy controls are visible for sensitive resume data.
- No export or backup path exists.

Recommended SaaS data model:

- `users`: account, profile, auth provider ID, plan, onboarding state.
- `resumes`: owner ID, title, original file path, preview image path, extracted text, version, status.
- `resume_versions`: stores each revision and score history.
- `job_targets`: company, title, job description, source URL, keywords, seniority.
- `resume_analyses`: model, prompt version, raw response, normalized scores, created date.
- `suggestions`: structured improvement suggestions tied to resume sections.
- `applications`: company, role, status, dates, notes, resume version used.
- `subscriptions`: Stripe customer/subscription IDs, plan, status, period end.
- `usage_events`: scans, rewrites, exports, AI calls, cost tracking.

This model would let HireLens become a real resume operating system rather than only a single resume scanner.

## AI And Resume Analysis Audit

Current implementation:

- `prepareInstructions()` tells the AI to act as an ATS and resume expert.
- It asks for structured JSON containing `overallScore`, `ATS`, `toneAndStyle`, `content`, `structure`, and `skills`.
- `Upload` sends the uploaded PDF plus prompt to Puter AI.
- The response is parsed with `JSON.parse`.

Strengths:

- The prompt is clear and product-aligned.
- The score categories are sensible for a resume product.
- The app already expects structured feedback, which is the right direction.

Risks:

- AI JSON parsing is fragile. If the model returns extra text, malformed JSON, markdown, or a slightly different shape, the analysis fails.
- There is no schema validation after parsing.
- `Feedback` typing is duplicated between `constants/index.ts` and `types/index.declaration.ts`.
- The analysis does not store prompt version, model name, token/cost metadata, or raw AI response.
- The AI output cannot yet power deeper features like rewrites, keyword matching, or resume version comparison because the app only stores broad feedback.
- There is no extracted resume text field.

Recommended AI upgrades:

- Add a JSON repair/normalization layer or use a structured-output capable API.
- Validate feedback with a schema library such as Zod.
- Store the raw AI response separately from the normalized feedback.
- Add `promptVersion` and `model` to every analysis.
- Extract resume text and store it for search, comparison, rewrite, and job matching.
- Add section-level analysis: summary, experience, education, skills, projects, certifications.
- Add job-fit scoring based on keyword coverage and requirement matching.
- Add generated bullet rewrites and before/after comparisons.

## UI/UX Audit

Current UI:

- The app has a bright, lightweight dashboard feel.
- Particle backgrounds are used on auth, home, upload, and resume pages.
- Resume cards show company, job title, score, and preview image.
- Upload page has a simple form and drag/drop PDF uploader.
- Resume detail page has a two-column layout: feedback on the left, resume preview on the right.
- Feedback is broken into summary, ATS, and accordion details.

Strengths:

- The core workflow is understandable.
- The visual identity has started: HireLens logo, gradient text, green primary action, resume scan animations.
- The resume detail page is a strong SaaS foundation because it creates a clear "analysis report" moment.
- The dashboard already hints at application tracking, not just file scanning.

UI issues to correct:

- The UI depends heavily on decorative particles. For a productivity SaaS, this may feel noisy and can reduce perceived trust.
- Cards and panels use large radii and visual effects that make the app feel more like a demo than a work tool.
- The dashboard lacks filtering, sorting, empty states beyond upload, search, and status summaries.
- The upload form requires company and job description, which is useful for job-targeted scans, but the product should also support a general resume review.
- The resume detail layout uses sticky preview and half-width sections that may be awkward on small screens.
- Some class names appear incorrect or ineffective: `itemscenter`, `justify--center`, `max-wxl:h-fit`, and `.uplader-drag-area`.
- Global `h1` uses negative tracking. This can create tight text and readability issues.
- The auth page has only login/logout and no explanation of what account access enables.
- There is no visible error component; upload errors are displayed as status text or browser alerts.
- There is no loading skeleton for resume cards.

Recommended UI direction for SaaS:

- Shift toward a focused productivity dashboard: cleaner navigation, less decorative motion, stronger information hierarchy.
- Add left navigation or top-level tabs for Dashboard, Resumes, Applications, Job Matches, Templates, and Settings.
- Add a resume library view with search, sort, filters, upload date, target role, and score.
- Add a detailed analysis report with tabs: Overview, ATS, Keywords, Rewrite Suggestions, Job Match, Versions.
- Add a guided upload flow that supports two modes: general audit and job-targeted audit.
- Add reusable alert/toast components for success, error, and warning states.
- Add plan/usage indicators where appropriate.

## Code Quality Audit

Strengths:

- TypeScript typecheck passes.
- The project is small and easy to navigate.
- The Puter integration is centralized in `app/lib/puter.ts`.
- PDF conversion is isolated in `app/lib/pdfToImg.ts`.
- The upload flow is readable and mostly linear.
- Components are named clearly around product concepts.

Code issues and cleanup:

- `constants/index.ts` mixes mock data, prompt templates, and TypeScript interfaces. Split these into domain types, prompts, and seed/mock data.
- `Feedback` and `Resume` types are duplicated globally and in constants.
- Several components rely on global declaration types instead of imported domain types.
- `isLoading` is pulled into `Upload` but not used.
- `gradientClass` is computed in `ATS.tsx` but not used; the component always renders the teal gradient.
- Resume object URLs are created but not revoked, which can leak memory during long sessions.
- `FileUploader` remove button calls `onFileSelect(null)` but does not clear `react-dropzone`'s `acceptedFiles`, so UI state may stay selected.
- `Home` logs parsed resumes to console in production code.
- Some `useEffect` dependency arrays are incomplete. For example, `navigate`, `auth.isAuthenticated`, `kv`, `fs`, and `feedback` dependencies are not consistently handled.
- Error handling often returns after setting status text but does not reset `isProcessing`.
- The AI response extraction assumes `feedback.message.content[0].text` exists when content is an array.
- There are `@ts-ignore` comments where the data shape should be fixed instead.
- The README is still the default React Router template and does not document HireLens.

## Bugs And Risk Areas

High priority:

- Auth redirects can happen before auth status finishes loading.
- `/upload` is not protected from unauthenticated access.
- AI JSON parsing can fail easily and blocks the user without a retry path.
- Partial upload records can be saved before analysis succeeds.
- Resume cards assume `feedback.overallScore` exists, but `feedback` is initialized as an empty string during upload.
- No validation exists for parsed KV records; bad data can crash rendering.

Medium priority:

- Object URLs are not revoked in `ResumeCard` and `Resume`.
- The upload remove action does not fully reset dropzone state.
- Several CSS class typos likely produce broken layout or unused styles.
- The app lacks accessible labels and error messaging patterns in a few places.
- `auth` route can navigate to an undefined route if `next` is absent.
- The favicon link type is `image/png+xml`, which should be `image/png`.

Lower priority:

- Default README does not match the product.
- Duplicate mock resume entries remain in `constants`.
- Some installed animation/icon packages are not meaningfully used.
- Global styles may make future dashboard screens harder to tune.

## What Can Be Built On Immediately

These are the most valuable SaaS features that can be built directly on the current foundation.

### 1. Resume Library

The home page already lists saved resumes. Expand it into a proper resume library:

- Search by company, role, date, score, and keyword.
- Sort by score, upload date, company, and job title.
- Add status labels: analyzed, failed, draft, archived.
- Add delete and rename actions.
- Add resume detail summaries directly on each card.
- Add score trend over time.

Why it fits: the app already stores resume records and renders resume cards.

### 2. Resume Versioning

Let users upload or generate multiple versions of the same resume:

- Baseline version.
- AI-improved version.
- Job-specific version.
- Recruiter-friendly version.
- ATS-focused version.

Why it fits: the current resume ID can evolve into a parent resume record with child versions.

### 3. Job-Targeted Resume Matching

The upload form already collects job title and job description. This can become a core paid feature:

- Match resume against job description.
- Extract missing keywords.
- Identify required vs preferred qualifications.
- Score requirement coverage.
- Recommend which bullets to rewrite.
- Generate a job-specific summary.

Why it fits: the current prompt already includes job title and job description.

### 4. AI Bullet Rewriter

Add an editor that rewrites weak resume bullets:

- Convert responsibilities into achievement bullets.
- Add measurable impact.
- Make bullets ATS-readable.
- Offer multiple tone options.
- Compare original vs revised text.

Why it fits: the current feedback categories identify content and style issues but do not yet help users act on them.

### 5. ATS Keyword Gap Tool

Create a keyword analysis page:

- Extract keywords from job description.
- Extract skills and phrases from resume.
- Show matched, missing, and overused terms.
- Recommend where to add missing terms naturally.

Why it fits: this can be powered by the same uploaded resume and job description.

### 6. Application Tracker

The current home copy says "Monitor Your Applications and Resume Scores." Build that idea:

- Track company, role, stage, resume used, applied date, follow-up date, notes.
- Attach each application to a resume version.
- Show pipeline columns: saved, applied, interview, offer, rejected.
- Add reminders and follow-up templates.

Why it fits: resume analysis becomes more valuable when tied to outcomes.

### 7. Resume Improvement Checklist

Turn AI feedback into tasks:

- Mark suggestions as done.
- Track improvement progress.
- Rescan after edits.
- Show score changes after each scan.

Why it fits: current tips are static; tasks create retention.

### 8. Resume Builder / Editor

Add structured resume editing:

- Profile, summary, experience, education, skills, projects.
- AI rewrite buttons per section.
- Export to PDF.
- Template selection.

Why it fits: users currently must leave the app to edit their resume. Bringing editing inside the product is the biggest step toward SaaS value.

### 9. Cover Letter Generator

Use the resume plus job description to generate:

- Tailored cover letters.
- Short recruiter messages.
- LinkedIn outreach drafts.
- Follow-up emails.

Why it fits: job description and resume context already exist.

### 10. SaaS Account And Billing

Add subscription logic:

- Free: limited scans per month.
- Pro: more scans, resume versions, AI rewrites, exports.
- Career: application tracker, cover letters, interview prep.
- Team/School: seats, shared admin, student/job seeker reporting.

Why it fits: AI analysis has a clear usage-based cost and value boundary.

## SaaS Product Strategy

The strongest SaaS angle is:

"HireLens helps job seekers tailor, score, improve, and track resumes for every job application."

Recommended product pillars:

- Analyze: score resumes and explain weaknesses.
- Tailor: match resume to a specific job description.
- Improve: rewrite bullets and sections.
- Track: connect resume versions to job applications.
- Learn: show score trends, missing skills, and progress.

Possible target customers:

- Individual job seekers.
- Students and recent graduates.
- Bootcamp graduates.
- Career coaches.
- Universities and workforce programs.
- Recruiting agencies helping candidates polish resumes.

Best first paid plan:

- Resume scans
- Job match reports
- AI rewrite suggestions
- Resume version history
- PDF export

Best future team plan:

- Coach/admin dashboard
- Student/candidate seats
- Shared resume review queue
- Progress reports
- Bulk import/export

## Recommended Development Roadmap

### Phase 1: Stabilize The MVP

- Fix auth guards and loading states.
- Protect `/upload`.
- Replace brittle `next` parsing with `URLSearchParams`.
- Add robust AI response parsing and schema validation.
- Fix CSS class typos.
- Reset `isProcessing` on all failure paths.
- Remove production console logs.
- Revoke object URLs.
- Update README for HireLens.

### Phase 2: Productize Resume Records

- Add created/updated dates and status to resume records.
- Add delete, retry analysis, and rename.
- Add empty, error, loading, and failed-analysis states.
- Add resume library search and filtering.
- Store raw AI output, model, prompt version, and normalized feedback.

### Phase 3: Add Core SaaS Resume Features

- Add job-targeted keyword matching.
- Add AI rewrite suggestions.
- Add resume versions.
- Add score history and rescan.
- Add application tracker.
- Add PDF export for improved resumes.

### Phase 4: Add SaaS Infrastructure

- Add app-owned database.
- Add billing with Stripe.
- Add plan limits and usage tracking.
- Add account/settings page.
- Add transactional emails.
- Add analytics and error monitoring.
- Add admin tools.

### Phase 5: Expand Into Career Workflow

- Cover letters.
- Recruiter messages.
- Interview prep from resume and job description.
- Career coach workspace.
- Team/school dashboards.

## Suggested Backend Direction

For a SaaS version, Puter is useful for prototype speed, but the app should eventually own the durable product data.

Recommended practical stack:

- Supabase or Neon Postgres for database.
- Supabase Storage, S3, or Cloudflare R2 for resume files.
- Clerk, Supabase Auth, or Auth.js for auth.
- Stripe for billing.
- PostHog for product analytics.
- Sentry for error tracking.
- Background jobs for long-running AI analysis.

If keeping Puter for now:

- Add a storage abstraction so the app can switch later.
- Avoid spreading Puter calls through components.
- Store records with clear versions and schema fields.

## Highest-Impact Corrections

Do these first:

1. Fix auth loading and route protection.
2. Protect `/upload`.
3. Add resilient feedback parsing and schema validation.
4. Add status fields to resume records.
5. Prevent incomplete records from crashing UI.
6. Add retry/delete flows.
7. Clean up UI class typos.
8. Replace alerts/status-only errors with a proper error UI.
9. Update README and remove template language.
10. Split constants, types, prompts, and mock data.

## Final Assessment

HireLens is a promising resume-analysis MVP with the right foundation for a SaaS. The app already has the hardest early product loop: authenticated upload, AI review, persistent records, and a detailed result page. The biggest opportunity is to stop thinking of it as a single "resume scanner" and turn it into a resume workflow platform.

The most natural SaaS evolution is a tool where users create resume versions, tailor each version to a job, get AI rewrites, track applications, and measure whether their resume is improving over time. That direction builds directly on what is already in the codebase and gives the product a stronger reason for users to return, pay, and keep their job search organized.

export const IMPROVED_RESUME_PROMPT = `IMPROVED RESUME:

Rewrite the resume to improve relevance, clarity and ATS compatibility.

Do not create a fictional candidate.

Maintain:

- identity
- employers
- roles
- dates
- education
- projects
- technologies
- verified metrics

You may:

- reorder bullets
- rewrite bullets
- tighten wording
- reorganize skills
- rewrite the professional summary
- emphasize more relevant existing experience

Do not add technologies that exist only in the job description.
Do not increase years of experience.
Do not create fake achievements.

Return structured sections suitable for deterministic PDF rendering.
Use an empty string for a date that the resume does not state.`;

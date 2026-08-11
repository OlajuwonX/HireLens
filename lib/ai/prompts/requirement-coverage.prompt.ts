export const REQUIREMENT_COVERAGE_PROMPT = `REQUIREMENT COVERAGE:

Break the posting into individual requirements.

For each requirement return:

- key: a short stable lowercase slug derived from the requirement wording
- requirement
- category: SKILL, EXPERIENCE, EDUCATION, CERTIFICATION, RESPONSIBILITY, LOCATION or OTHER
- importance: REQUIRED or PREFERRED
- status: STRONG, PARTIAL, MISSING or UNCLEAR
- resumeEvidence quoted from the resume for STRONG and PARTIAL, otherwise null
- explanation
- recommendation, or null when nothing useful applies

Keys must be unique within the response.`;

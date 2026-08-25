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

Use PARTIAL for related or transferable evidence and name the difference in the explanation. Never record a related technology as STRONG for the required one.

When the posting states a minimum length of experience the resume does not reach, return it as its own requirement, mark it PARTIAL or MISSING, and state the shortfall in the explanation rather than resolving it in the candidate's favour.

Keys must be unique within the response.`;

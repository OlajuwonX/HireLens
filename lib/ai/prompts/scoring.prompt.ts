export const SCORING_PROMPT = `SCORING:

Score conservatively.

100 means the resume strongly demonstrates nearly all important requirements.
Do not inflate scores because technologies are related.
Missing hard requirements must reduce the score.

Evaluate and return:

- overallScore
- atsScore
- requirementsScore
- skillsScore
- experienceScore
- keywordScore
- explanation`;

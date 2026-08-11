export const RECOMMENDATIONS_PROMPT = `RECOMMENDATIONS:

Return only meaningful recommendations.

Each recommendation must contain:

- problem
- evidence
- recommendedAction
- reason
- priority

Priorities: HIGH, MEDIUM, LOW.

Never recommend claiming experience the candidate does not have.
Do not recommend inventing missing experience.`;

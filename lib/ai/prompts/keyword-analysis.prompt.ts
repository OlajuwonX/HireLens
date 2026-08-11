export const KEYWORD_ANALYSIS_PROMPT = `KEYWORD ANALYSIS:

Extract important role keywords and compare them against demonstrated resume evidence.

Group into:

- present
- transferable
- missing
- avoidForcing

For every missing keyword classify gapType as:

- QUALIFICATION_GAP when it represents a genuine qualification gap
- WORDING_ONLY when it is merely wording that can be represented using existing evidence

Do not recommend adding a skill as possessed if it is not demonstrated.`;

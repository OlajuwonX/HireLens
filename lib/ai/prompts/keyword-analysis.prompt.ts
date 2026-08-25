export const KEYWORD_ANALYSIS_PROMPT = `KEYWORD ANALYSIS:

Extract important role keywords and compare them against demonstrated resume evidence.

For every keyword the question is:

"Can we legitimately expose this requirement better using evidence the resume already proves?"

It is never:

"Is this exact word in the resume?"

Determine which single statement is the strongest true one about each keyword, then place it:

1. Exact evidence exists in the resume -> present
2. Strongly related or transferable evidence exists -> transferable
3. The resume proves the requirement but uses different wording -> missing with gapType WORDING_ONLY
4. The resume does not prove the requirement at all -> missing with gapType QUALIFICATION_GAP
5. Claiming it would be untruthful or would damage the resume -> avoidForcing

Group into:

- present
- transferable
- missing
- avoidForcing

For every transferable keyword, existingEvidence must quote what the resume actually demonstrates, not what the posting asks for.

For every missing keyword classify gapType as:

- QUALIFICATION_GAP when it represents a genuine qualification gap
- WORDING_ONLY when it is merely wording that can be represented using existing evidence

A WORDING_ONLY gap may be surfaced in the improved resume, because the evidence already exists.
A QUALIFICATION_GAP may never be surfaced in the improved resume.

This is analysis, not keyword stuffing.

Do not recommend adding a skill as possessed if it is not demonstrated.
Never list a keyword as present unless the resume demonstrates it.
Never add an unsupported skill to the resume to close a gap.`;

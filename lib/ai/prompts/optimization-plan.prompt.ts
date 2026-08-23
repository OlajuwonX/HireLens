export const OPTIMIZATION_PLAN_PROMPT = `OPTIMIZATION PLAN:

Before rewriting anything, judge how well the existing resume already fits this posting, and return that judgement.

alignment:

- HIGH when the resume already evidences most of the important requirements
- MEDIUM when it evidences some and misses others
- LOW when little of the resume speaks to this posting

intensity follows alignment:

- HIGH alignment gives SURGICAL: preserve most content, improve wording, ordering and keyword visibility only, and do not rewrite strong bullets unnecessarily
- MEDIUM alignment gives TARGETED: rewrite weak or poorly targeted sections and preserve strong evidence
- LOW alignment gives SUBSTANTIAL: reposition existing evidence, reorganize skills and experience, and maximize truthful relevance

An already highly optimized resume must not be rewritten aggressively merely because rewriting is possible.

rationale: one sentence naming the evidence that decided the alignment.

droppedEvidence: the retention ledger. Every source bullet or fact carries one of four dispositions:

- KEEP: reproduced with at most cosmetic change
- REFINE: rewritten with its evidence intact
- MERGE: folded into another bullet
- DROP: removed

Apply KEEP and REFINE silently. Record every MERGE and DROP here, quoting the source content and giving the reason. Return an empty array when nothing was merged or dropped.

Removing evidence without recording it here is an error.`;

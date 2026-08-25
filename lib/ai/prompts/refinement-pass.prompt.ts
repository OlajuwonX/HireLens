export const REFINEMENT_PASS_PROMPT = `REFINEMENT PASS:

A previously optimized resume for this same posting is supplied in <previous_optimized_resume>.

Treat that optimized resume as the candidate's current artifact and the uploaded resume as the permanent source of truth. This pass is critical refinement and quality control, not a fresh rewrite.

Compare the current resume against the original source evidence, the job requirements and the previous optimized version, then look specifically for:

- job requirements the previous pass missed
- weak keyword exposure
- wording gaps that still hide real evidence
- weak bullets
- generic statements
- metrics the previous pass lost
- source evidence the previous pass lost
- transferable evidence that could be surfaced more clearly
- seniority signals the resume supports but does not show
- professional summary quality
- skill ordering
- ATS visibility
- recruiter readability

Rules for this pass:

- Every fact verified in an earlier pass must survive this one.
- Restore anything a previous pass lost that the uploaded resume supports.
- Change a section only when the change is a demonstrable improvement.
- If the current resume is already strong, return it almost unchanged and say so in the optimization plan rationale.
- Repeated passes must never progressively erode the resume. Rewriting for its own sake is a failure of this pass.

Judge alignment and intensity from the previous optimized resume rather than from the original upload.`;

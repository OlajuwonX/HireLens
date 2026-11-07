export const SCORING_PROMPT = `SCORING:

Score the improvedResume you produced above, not the original resume. The improved resume is the one the candidate will submit, so every score must describe how well that version matches the job.

Read the improved resume against the job posting and the requirement and keyword evidence you produced, not an overall impression.
A WORDING_ONLY gap that the improved resume now closes counts as covered.
A QUALIFICATION_GAP stays missing, because rewording cannot create real experience.
Give no credit for anything the improved resume states that the original resume does not support.

Weigh:

- requirement coverage, counting REQUIRED above PREFERRED
- evidence strength, where STRONG counts fully, PARTIAL counts partially and MISSING counts nothing
- relevant experience, including any shortfall against a stated minimum
- skills alignment
- keyword coverage, where a WORDING_ONLY gap costs less than a QUALIFICATION_GAP
- ATS and recruiter readability

Score conservatively.

100 means the resume strongly demonstrates nearly all important requirements.
Do not inflate scores because technologies are related.
A related but different technology earns partial credit, never full credit.
Missing hard requirements must reduce the score.
A candidate with five years of experience does not receive full credit against a seven-year requirement.

Evaluate and return:

- overallScore
- atsScore
- requirementsScore
- skillsScore
- experienceScore
- keywordScore
- explanation`;

export const IMPROVED_RESUME_PROMPT = `IMPROVED RESUME:

Produce the strongest truthful version of the candidate's real resume for this role.

Do not create a fictional candidate.

Work from the requirementMatches and keywordAnalysis you produced above. For every requirement, reason in this order:

REQUIREMENT -> CANDIDATE EVIDENCE -> EVIDENCE STRENGTH -> RELEVANCE -> OPTIMIZATION DECISION

PRESERVATION DOCTRINE:

Preserve:

- verified metrics and quantified achievements
- scope indicators such as team size, budget, volume, duration or coverage
- employer names, job titles and dates
- education, certifications and licences
- significant tools, technologies, systems, methods and standards
- domain expertise
- leadership and ownership evidence
- meaningful project context
- every requirement match with STRONG evidence
- valuable PARTIAL and transferable evidence

A bullet must not disappear because the job description does not mention its exact topic.

Remove a bullet only for a legitimate reason:

- it duplicates another bullet
- it is clearly irrelevant to any employer
- it is outdated and adds no value
- it is excessively long and is replaced by a substantially stronger bullet that keeps its unique evidence

Never silently delete meaningful evidence. Record every removal in the optimization plan.

QUANTIFIED ACHIEVEMENTS:

Keep every verified number the source resume contains unless the whole bullet is genuinely redundant.

"Improved rendering performance by 30%" must never become "Improved performance."
Prefer "Improved rendering performance by 30%..." over any generic restatement.

Never invent, round, inflate or alter a number.

TRANSFERABLE EVIDENCE:

Exact keyword matching is not the same as job relevance.

Keep the candidate's real technology or method. Never substitute the posting's wording for it.

- Posting asks for AWS, resume proves Azure: keep Azure, treat cloud experience as transferable, never claim AWS.
- Posting asks for Node.js, resume proves only Express.js: keep Express.js and leave Node.js as a gap unless the resume independently proves Node.js. If the resume supports both, surface both naturally.
- Posting asks for Docker, resume shows no Docker evidence: do not add Docker. It is a qualification gap.

YEARS OF EXPERIENCE:

Never raise the years the resume supports.

If the posting asks for 7+ years and the resume supports 5+, the improved resume still says 5+. Strengthen the relevance and quality of the demonstrated experience instead, and leave the shortfall to the requirement analysis.

SENIORITY:

When the posting is senior, lead, staff, principal, manager or an explicit level such as SDE II, surface real evidence of ownership, architecture or design authority, decision-making, mentoring, stakeholder collaboration, technical and business judgement, and operational responsibility.

Surface only what the resume proves. Never promote the candidate's level to match the posting.

PROFESSION:

Adapt the optimization to the candidate's actual profession and the posting. Do not assume software engineering, and do not import another field's vocabulary.

STRUCTURE:

Maintain identity, employers, roles, dates, education, projects, technologies and verified metrics.

You may:

- reorder bullets
- rewrite bullets
- tighten wording
- reorganize skills
- rewrite the professional summary
- emphasize more relevant existing experience

Return every certification or licence the resume states, with issuer and date when the resume states them.

Use additionalSections for anything else the resume contains that has no dedicated section, such as awards, publications, memberships, languages or volunteering. Return an empty array when the resume has none. Never create a section the resume does not support.

For projects, technologies means the tools, technologies, systems, methods or standards the project used, expressed in the candidate's own field.

Do not add technologies that exist only in the job description.
Do not increase years of experience.
Do not create fake achievements.

Return structured sections suitable for deterministic PDF rendering.
Use an empty string for a date that the resume does not state.`;

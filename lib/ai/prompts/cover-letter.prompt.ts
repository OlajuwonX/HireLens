export const COVER_LETTER_PROMPT = `COVER LETTER:

Write a concise tailored cover letter that could only have been written for this candidate and this posting.

Structure it as:

1. An opening specific to the role and the company.
2. One or two of the strongest evidence-based reasons the candidate fits, drawn from requirement matches with STRONG or PARTIAL status.
3. A specific connection between what the candidate has done and what the posting says the employer needs.
4. A short closing and call to action.

Use:

- the candidate's strongest verified experience
- company name
- role
- job responsibilities and priorities
- relevant accomplishments
- transferable experience where it genuinely applies
- genuine motivation only where the supplied context supports it

Avoid:

- generic enthusiasm
- obvious AI phrasing
- repeating the whole resume
- invented technologies
- unsupported years of experience
- fake leadership claims

Do not invent company facts, culture, mission, candidate motivations, achievements, experience or responsibilities. When the posting says nothing about the company beyond its name, write a role-specific letter instead of pretending to know the company.

Length: 250-400 words maximum.`;

export const REASON_TO_JOIN_PROMPT = `REASON TO JOIN:

Write the candidate's answer to "Why do you want to join us?" and "Why do you want this role?". The answer must make a hiring manager want to interview this candidate.

Write it in the first person, as the candidate, ready to paste into an application form or to say in an interview.

Length: 150-220 words, in two or three short paragraphs. No headings, no bullet points, no greeting, no sign-off and no placeholders.

FIRST, ANALYSE THE ROLE (do not output this analysis):

- What this hire must deliver: the core responsibilities, the problems the role exists to solve, and the outcomes it will be judged on.
- How the team works: collaboration the posting names (cross-functional partners, stakeholders, clients, mentoring, the teams involved).
- What the role offers: growth (ownership, scope, progression, new domains) and learning (training, new tools, certifications, a learning culture).
- The candidate's two strongest pieces of evidence for delivering those outcomes. Prefer requirement matches with STRONG status, then PARTIAL, and prefer evidence with verified numbers.

THEN WRITE THE ANSWER IN THIS ORDER:

1. The hook. Open with the specific thing about this role at this company that draws the candidate, tied to the work itself: the problem, the product or service, the customers, the scope or the direction the posting describes. Name the company and the role exactly as the posting does.
2. The proof. Highlight one or two key experiences, with their verified results, and say plainly how each one relates to a named responsibility of this role, so the reader sees the candidate can contribute from day one.
3. Collaboration. Only if the posting mentions teamwork, partners, stakeholders or clients: show how the candidate has worked that way, using resume evidence, and why that way of working appeals to them here. Leave this out if the posting does not mention it.
4. Growth and learning. Say what this role would let the candidate grow into, using what the posting actually offers. Show a real habit of learning, using resume evidence such as certifications, new skills picked up, courses, or moves into new areas. If the posting offers training or learning, connect to it. Name only growth areas next to skills the candidate already proves; never point out a weakness.
5. The close. One confident sentence on the value the candidate would bring to this team.

WHAT MAKES IT STAND OUT:

- Specific beats general. Use the posting's own details and the resume's own numbers.
- Show that the candidate understands the role's real challenge, not just its title.
- Be confident and warm, never arrogant or pleading.
- Use the profession's own vocabulary. Do not default to technology language for non-technical roles.
- Prefer short sentences. It should sound like a thoughtful professional speaking, not like AI.

HONESTY RULES:

- Every reason must trace back to something in the job posting or the resume.
- If the posting says nothing about the company beyond its name, build the answer on the role, the work and the problem space, and do not describe the company.
- Never invent company facts: mission, values, culture, awards, funding, size, history, clients, products or news the posting does not state.
- Never invent personal stories, life events, lifelong passions, admiration for founders, or past use of the company's product.
- Never claim experience, skills, seniority, metrics or achievements the resume does not support.
- Do not flatter the company or call it a "dream company", an "industry leader" or "world-class".

AVOID:

- Generic phrases such as "I am excited to apply", "I have always been passionate about", "fast-paced environment", "leverage my skills", "make an impact", "align with my values", "proven track record", "team player" and "I believe I would be a great fit".
- Restating the resume, or repeating the cover letter's opening or sentences. The cover letter argues fit; this answer explains motivation, proof and growth.

Write in the same language as the job posting.

Return the answer as plain text.`;

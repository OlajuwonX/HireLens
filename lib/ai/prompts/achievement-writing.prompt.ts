export const ACHIEVEMENT_WRITING_PROMPT = `ACHIEVEMENT WRITING:

Evaluate every experience bullet for five qualities and strengthen only what the source supports:

- Action: what the candidate did
- Context: the system, product or problem involved
- Scope: the scale of the work
- Method: the tools or techniques used
- Outcome: what changed because of the work

Not every bullet needs a number. A clear description of ownership and technical complexity is better than an invented metric.

Example, when the source supports it:
Before: "Worked on frontend development using React and TypeScript."
After: "Developed and maintained React and TypeScript interfaces for a SaaS platform, building reusable components and integrating REST APIs for core product workflows."
No metric was added because none existed.

KEYWORD INTEGRATION:

Use the keywordAnalysis you produced:

- present: improve placement and visibility
- transferable: describe the real equivalent experience, never the posting's technology
- missing with WORDING_ONLY: introduce the supported wording naturally
- missing with QUALIFICATION_GAP: never introduce it as a possessed skill
- avoidForcing: exclude entirely

Prefer exact terminology where the evidence supports it, recognise common synonyms, and respect required versus preferred qualifications. Keyword density is never the goal.

LENGTH AND RELEVANCE:

Do not force every resume onto one page.

- Junior candidates: concise and evidence-focused
- Mid-level candidates: room to show progression
- Senior candidates: room for architecture, leadership, ownership and business impact
- Specialists: preserve relevant technical depth

Remove repetition, never meaningful experience.`;

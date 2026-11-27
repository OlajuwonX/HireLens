export type SceneId = "posting" | "reading" | "match" | "gaps" | "apply" | "reply";

export type Scene = { id: SceneId; kicker: string; title: string; body: string };

export const scenes: Scene[] = [
  {
    id: "posting",
    kicker: "A posting lands",
    title: "A role you want shows up in Discover.",
    body: "HireLens checks the companies you follow every day and brings back the roles that fit the titles you are after.",
  },
  {
    id: "reading",
    kicker: "HireLens reads it",
    title: "The posting becomes a checklist.",
    body: "The title, the company and every requirement are pulled out, so you see what the hiring team is really asking for.",
  },
  {
    id: "match",
    kicker: "You see the match",
    title: "One honest score, broken down.",
    body: "Your resume is checked against each requirement. Strong areas show in lime, gaps in amber.",
  },
  {
    id: "gaps",
    kicker: "Close the gaps",
    title: "Fix what is missing without making anything up.",
    body: "Suggestions only use your real experience. Where a number would help, you get a marked placeholder to fill in yourself.",
  },
  {
    id: "apply",
    kicker: "Apply ready",
    title: "Everything for the application in one place.",
    body: "A tailored resume, a cover letter and a clear stage for the job, from tracking to sent.",
  },
  {
    id: "reply",
    kicker: "The reply",
    title: "The interview lands on your Today list.",
    body: "Replies from your inbox are matched to the job, and the next step is waiting when you open HireLens.",
  },
];

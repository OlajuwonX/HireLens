import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import type { TraceEntry } from "@/lib/ai/schemas/traceability.schema";

export const sourceText = `Ada Obi
Frontend Engineer | Lagos, Nigeria | ada@example.com

EXPERIENCE
Frontend Engineer, Brightpay  Jan 2021 - Present
• Built and maintained React and TypeScript interfaces for a payments
dashboard used by merchants
• Improved page load performance by 35% by code splitting and lazy loading routes
• Implemented reusable UI components shared across 4 product teams
• Collaborated with backend engineers to integrate REST APIs

Junior Developer, Webcraft  Jun 2019 - Dec 2020
• Developed marketing websites with Next.js and Tailwind CSS
• Fixed accessibility issues across 12 client sites

SKILLS
React, TypeScript, Next.js, Tailwind CSS, Jest, REST APIs, Git

EDUCATION
BSc Computer Science, University of Lagos, 2019`;

export const job = {
  title: "Senior Frontend Engineer",
  company: "Northwind",
  location: "Remote",
  workArrangement: "Remote",
  employmentType: "Full-time",
  deadline: null,
  source: null,
  sourceUrl: null,
  description: "Build React and TypeScript product interfaces. Experience with GraphQL and AWS is a plus.",
  requirements: "5+ years of frontend experience",
};

export function faithfulResume(): ImprovedResume {
  return {
    header: {
      name: "Ada Obi",
      headline: "Frontend Engineer",
      location: "Lagos, Nigeria",
      email: "ada@example.com",
      phone: null,
      links: [],
    },
    professionalSummary:
      "Frontend engineer building React and TypeScript product interfaces, focused on performance and reusable components.",
    skills: [
      { category: "Frontend", items: ["React", "TypeScript", "Next.js", "Tailwind CSS"] },
      { category: "Tools", items: ["Jest", "Git", "REST APIs"] },
    ],
    experience: [
      {
        company: "Brightpay",
        title: "Frontend Engineer",
        location: null,
        startDate: "Jan 2021",
        endDate: "Present",
        bullets: [
          "Built and maintained React and TypeScript interfaces for a merchant payments dashboard.",
          "Improved page load performance by 35% through code splitting and lazy-loaded routes.",
          "Implemented reusable UI components shared across 4 product teams.",
          "Integrated REST APIs in collaboration with backend engineers.",
        ],
      },
      {
        company: "Webcraft",
        title: "Junior Developer",
        location: null,
        startDate: "Jun 2019",
        endDate: "Dec 2020",
        bullets: [
          "Developed marketing websites with Next.js and Tailwind CSS.",
          "Fixed accessibility issues across 12 client sites.",
        ],
      },
    ],
    projects: [],
    education: [
      { qualification: "BSc Computer Science", institution: "University of Lagos", date: "2019" },
    ],
    certifications: [],
    additionalSections: [],
  };
}

export function fullTrace(ids: string[]): TraceEntry[] {
  return ids.map((sourceId) => ({ sourceId, action: "REFINE", reason: "" }));
}

type Plant =
  | "fabricated-technology"
  | "inflated-years"
  | "changed-date"
  | "invented-metric"
  | "lost-metric"
  | "empty-summary";

export function plant(kind: Plant): ImprovedResume {
  const resume = faithfulResume();
  const [brightpay] = resume.experience;

  switch (kind) {
    case "fabricated-technology":
      resume.skills[0].items.push("GraphQL", "AWS");
      break;
    case "inflated-years":
      resume.professionalSummary = "Frontend engineer with 8+ years building React interfaces.";
      break;
    case "changed-date":
      brightpay.startDate = "Jan 2017";
      break;
    case "invented-metric":
      brightpay.bullets.push("Increased merchant conversion by 22%.");
      break;
    case "lost-metric":
      brightpay.bullets[1] = "Improved page load performance through code splitting.";
      break;
    case "empty-summary":
      resume.professionalSummary = "";
      break;
  }

  return resume;
}

import type { TaskPayload } from "../src/contract";
import type { FormField } from "../src/execution/fields";

export function payload(overrides: Partial<TaskPayload> = {}): TaskPayload {
  return {
    task: { id: "11111111-1111-4111-8111-111111111111", platform: "GREENHOUSE", url: "https://boards.greenhouse.io/acme/jobs/1" },
    job: { title: "Frontend Engineer", company: "Acme" },
    candidate: {
      firstName: "Ada",
      lastName: "Obi",
      fullName: "Ada Obi",
      email: "ada@example.com",
      phone: "+234 800 000 0000",
      location: "Lagos, Nigeria",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: null,
      portfolioUrl: "https://ada.dev",
      authorizedCountries: ["Nigeria"],
      requiresSponsorship: false,
      willingToRelocate: true,
      salaryMin: 50000,
      salaryCurrency: "USD",
      noticePeriodWeeks: 4,
      yearsExperience: 4,
    },
    answers: [{ question: "Why do you want to work at Acme?", answer: "I want to build payments tools." }],
    coverLetter: "Dear Acme, I build React apps.",
    resumePath: "/api/worker/tasks/1/resume",
    ...overrides,
  };
}

export function field(label: string, overrides: Partial<FormField> = {}): FormField {
  return { selector: `#${label.replace(/\W+/g, "_")}`, kind: "text", label, required: false, options: [], ...overrides };
}

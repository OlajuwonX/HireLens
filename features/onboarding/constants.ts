export type OnboardingProgress = {
  hasResumeVersion: boolean;
  hasApplication: boolean;
  hasDocument: boolean;
};

export type OnboardingStep = {
  id: string;
  route: string;
  anchors: string[];
  title: string;
  body: string;
  isDone: (progress: OnboardingProgress) => boolean;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "ADD_RESUME",
    route: "/dashboard",
    anchors: ["add-resume"],
    title: "Start with your resume",
    body: "Add your most recent resume as a PDF. Give it the job title you apply for, and HireLens uses it for every analysis you run.",
    isDone: (progress) => progress.hasResumeVersion,
  },
  {
    id: "CREATE_APPLICATION",
    route: "/dashboard",
    anchors: ["create-application"],
    title: "Now add the job",
    body: "Your resume is in. Open the application page to save the job you are targeting and analyze your resume against it.",
    isDone: (progress) => progress.hasApplication,
  },
  {
    id: "PASTE_JOB",
    route: "/dashboard/applications",
    anchors: ["paste-job"],
    title: "Paste the job posting",
    body: "Copy the whole listing from the job page and paste it in. HireLens sorts out the input for you, then press Extract job details.",
    isDone: (progress) => progress.hasApplication,
  },
  {
    id: "REVIEW_AND_SAVE",
    route: "/dashboard/applications",
    anchors: ["save-analyze"],
    title: "Check it, then analyze",
    body: "Correct anything the extraction got wrong, and paste the job's own link into Job posting URL. When it reads right, press Save & Analyze.",
    isDone: (progress) => progress.hasApplication,
  },
  {
    id: "SAVE_DOCUMENT",
    route: "/dashboard/jobs",
    anchors: ["ai-results", "analysis-tab"],
    title: "Keep what you need",
    body: "Open the Analysis tab to see every AI result for this job. Save the ones you want to AI Documents to edit or download later.",
    isDone: (progress) => progress.hasDocument,
  },
];

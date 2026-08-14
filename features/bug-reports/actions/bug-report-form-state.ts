export type BugReportFormState = {
  status: "idle" | "error" | "sent";
  message: string;
};

export const initialBugReportFormState: BugReportFormState = {
  status: "idle",
  message: "",
};

export type AnalysisFormState = {
  status: "idle" | "error" | "saved";
  message: string;
};

export const initialAnalysisFormState: AnalysisFormState = {
  status: "idle",
  message: "",
};

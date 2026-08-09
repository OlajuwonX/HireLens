export type JobFormState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: Record<string, string>;
};

export const initialJobFormState: JobFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

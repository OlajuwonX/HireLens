export type ApplicationFormState = {
  status: "idle" | "error" | "saved";
  message: string;
  fieldErrors: Record<string, string>;
};

export const initialApplicationFormState: ApplicationFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

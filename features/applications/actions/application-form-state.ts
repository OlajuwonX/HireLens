export type ApplicationFormState = {
  status: "idle" | "error" | "saved";
  message: string;
};

export const initialApplicationFormState: ApplicationFormState = {
  status: "idle",
  message: "",
};

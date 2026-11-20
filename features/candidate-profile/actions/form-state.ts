export type ProfileFormState = {
  status: "idle" | "error" | "saved";
  message: string;
  fieldErrors: Record<string, string>;
  values?: Record<string, string>;
};

export const initialProfileFormState: ProfileFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export type PasswordFormState = {
  status: "idle" | "error" | "saved";
  message: string;
};

export const initialPasswordFormState: PasswordFormState = {
  status: "idle",
  message: "",
};

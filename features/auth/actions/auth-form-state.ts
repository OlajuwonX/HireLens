export type AuthFormState = {
  status: "idle" | "error";
  message: string;
};

export const initialAuthFormState: AuthFormState = {
  status: "idle",
  message: "",
};

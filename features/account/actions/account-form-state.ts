export type AccountFormState = {
  status: "idle" | "error";
  message: string;
};

export const initialAccountFormState: AccountFormState = {
  status: "idle",
  message: "",
};

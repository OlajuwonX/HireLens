export type DocumentFormState = {
  status: "idle" | "error" | "saved";
  message: string;
};

export const initialDocumentFormState: DocumentFormState = {
  status: "idle",
  message: "",
};

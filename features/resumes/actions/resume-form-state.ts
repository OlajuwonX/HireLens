export type UploadResumeFormState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialUploadResumeState: UploadResumeFormState = {
  status: "idle",
  message: "",
};

export type RenameResumeFormState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialRenameResumeState: RenameResumeFormState = {
  status: "idle",
  message: "",
};

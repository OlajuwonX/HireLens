export type InterviewAnswerState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "answered";
      questionPublicId: string;
      selectedOption: number;
      correct: boolean;
      correctOption: number;
      explanation: string;
    };

export const initialInterviewAnswerState: InterviewAnswerState = {
  status: "idle",
};

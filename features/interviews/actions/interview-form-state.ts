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

export type StartInterviewWeekState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "pending_generation" }
  | { status: "started" };

export const initialStartInterviewWeekState: StartInterviewWeekState = {
  status: "idle",
};

import { z } from "zod";
import { queueFor, TASK_STATES, type QueueName, type TaskState } from "@/lib/auto-apply/states";

export const HISTORY_SIZE = 3;

export type TaskView = {
  publicId: string;
  title: string;
  company: string;
  sourceUrl: string | null;
  state: TaskState;
  stateReason: string | null;
  needs: string[];
  history: string[];
};

type Row = {
  id: string;
  publicId: string;
  title: string;
  company: string;
  sourceUrl: string | null;
  state: string;
  stateReason: string | null;
  needs: unknown;
};

type Event = { taskId: string; note: string | null };

export function groupTasks(rows: Row[], events: Event[]) {
  const groups: Partial<Record<QueueName, TaskView[]>> = {};

  for (const row of rows) {
    const state = z.enum(TASK_STATES).catch("FAILED").parse(row.state);
    const queue = queueFor(state);

    if (!queue) {
      continue;
    }

    const history = events
      .filter((event) => event.taskId === row.id && event.note)
      .slice(0, HISTORY_SIZE)
      .map((event) => event.note as string);

    (groups[queue] ??= []).push({
      publicId: row.publicId,
      title: row.title,
      company: row.company,
      sourceUrl: row.sourceUrl,
      state,
      stateReason: row.stateReason,
      needs: z.array(z.string()).catch([]).parse(row.needs),
      history,
    });
  }

  return groups;
}

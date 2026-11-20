import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { groupTasks } from "@/features/auto-apply/task-view";

const read = (path: string) => readFileSync(path, "utf8");
const actions = read("features/auto-apply/actions/task-actions.ts");
const repository = read("features/auto-apply/server/task.repository.ts");
const migration = read("drizzle/0033_application_tasks.sql");

describe("auto apply actions", () => {
  it("authenticate and validate ids in one shared guard", () => {
    expect(actions).toContain("await requireDatabaseUser()");
    expect(actions).toContain("idSchema.safeParse(publicId)");
    expect(actions.match(/withTask\(/g)?.length).toBe(6);
  });

  it("offer no way to submit from the web app", () => {
    expect(actions).not.toContain('"SUBMITTING"');
  });
});

describe("the task repository", () => {
  it("only moves a task from the state it expects", () => {
    expect(repository).toContain("eq(applicationTasks.state, input.from)");
  });

  it("records every move as an event in the same transaction", () => {
    const transition = repository.slice(repository.indexOf("export async function transitionTask"));

    expect(transition).toContain("db.transaction");
    expect(transition).toContain("insert(applicationTaskEvents)");
  });
});

describe("the migration", () => {
  it("is additive", () => {
    expect(migration).not.toMatch(/\bDROP\b|\bALTER COLUMN\b|\bRENAME\b/i);
  });

  it("allows one task per application", () => {
    expect(migration).toContain('UNIQUE INDEX "application_tasks_application_idx"');
  });
});

describe("groupTasks", () => {
  const row = (id: string, state: string) => ({
    id,
    publicId: `p-${id}`,
    title: "t",
    company: "c",
    sourceUrl: null,
    state,
    stateReason: null,
    needs: ["Phone"],
  });

  it("sorts tasks into queues with their latest history", () => {
    const groups = groupTasks(
      [row("1", "READY_FOR_REVIEW"), row("2", "NEEDS_INPUT"), row("3", "SUBMISSION_UNCONFIRMED")],
      [
        { taskId: "1", note: "Ready" },
        { taskId: "1", note: "Reviewed" },
        { taskId: "1", note: "Analyzed" },
        { taskId: "1", note: "Queued" },
        { taskId: "2", note: null },
      ],
    );

    expect(groups.READY?.[0].history).toEqual(["Ready", "Reviewed", "Analyzed"]);
    expect(groups.NEEDS_YOU?.[0].needs).toEqual(["Phone"]);
    expect(groups.MANUAL?.[0].state).toBe("SUBMISSION_UNCONFIRMED");
  });

  it("treats an unknown stored state as failed rather than crashing", () => {
    expect(groupTasks([row("9", "WEIRD")], []).NEEDS_YOU?.[0].state).toBe("FAILED");
  });
});

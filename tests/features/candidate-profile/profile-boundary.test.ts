import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formValues } from "@/lib/forms/form-values";

const read = (path: string) => readFileSync(path, "utf8");

const actions = [
  read("features/candidate-profile/actions/profile-actions.ts"),
  read("features/candidate-profile/actions/answer-actions.ts"),
];
const repositories = [
  read("features/candidate-profile/server/profile.repository.ts"),
  read("features/candidate-profile/server/answer.repository.ts"),
];
const migration = read("drizzle/0029_candidate_profile.sql");

describe("candidate profile actions", () => {
  it("authenticate before touching input", () => {
    for (const source of actions) {
      const auth = source.indexOf("await requireDatabaseUser()");

      expect(auth).toBeGreaterThan(-1);
      expect(auth).toBeLessThan(source.indexOf("safeParse("));
    }
  });

  it("take the user from the session, never the form", () => {
    for (const source of actions) {
      expect(source).toContain("userId: user.id");
      expect(source).not.toMatch(/formData\.get\("userId"\)/);
    }
  });
});

describe("candidate profile repositories", () => {
  it("scope every write and read by userId", () => {
    const answers = repositories[1];
    const scopedQueries = answers.match(/eq\(candidateAnswers\.userId/g) ?? [];

    expect(scopedQueries.length).toBeGreaterThanOrEqual(5);
    expect(repositories[0]).toContain("eq(candidateProfiles.userId, userId)");
  });
});

describe("the migration is additive", () => {
  it("only creates tables and indexes", () => {
    expect(migration).not.toMatch(/\bDROP\b|\bALTER COLUMN\b|\bRENAME\b/i);
    expect(migration).toContain('CREATE TABLE "candidate_profiles"');
    expect(migration).toContain('CREATE TABLE "candidate_answers"');
  });

  it("cascades with the user so account purge removes it", () => {
    expect(migration.match(/ON DELETE cascade/g)).toHaveLength(2);
  });

  it("enforces one profile per user and unique questions", () => {
    expect(migration).toContain('UNIQUE INDEX "candidate_profiles_user_idx"');
    expect(migration).toContain('UNIQUE INDEX "candidate_answers_user_question_idx"');
  });
});

describe("formValues", () => {
  it("joins repeated keys and skips framework fields and files", () => {
    const data = new FormData();
    data.append("$ACTION_ID_abc", "x");
    data.append("workArrangements", "REMOTE");
    data.append("workArrangements", "HYBRID");
    data.append("phone", "123");
    data.append("file", new Blob(["x"]));

    expect(formValues(data)).toEqual({
      workArrangements: "REMOTE,HYBRID",
      phone: "123",
    });
  });
});

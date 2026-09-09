import { describe, expect, it } from "vitest";
import { toGeminiResponseSchema } from "@/lib/ai/gemini-json-schema";
import { toStrictJsonSchema } from "@/lib/ai/json-schema";
import {
  assertValidInterviewPool,
  generatedInterviewPoolSchema,
  REQUIRED_DIFFICULTY_DISTRIBUTION,
  type GeneratedDifficulty,
} from "@/lib/ai/schemas/interview-pool.schema";
import { MockApplicationIntelligenceProvider } from "@/lib/ai/providers/mock-application-intelligence-provider";

function question(n: number, difficulty: GeneratedDifficulty) {
  return {
    question: `Question number ${n} that is long enough to be a real prompt about the role`,
    options: [`A${n}`, `B${n}`, `C${n}`, `D${n}`],
    correctOption: n % 4,
    explanation: `Explanation ${n} for why the correct option holds up under scrutiny.`,
    difficulty,
    topic: `topic-${n}`,
  };
}

function validPool() {
  const questions: ReturnType<typeof question>[] = [];
  let n = 1;

  for (const difficulty of Object.keys(
    REQUIRED_DIFFICULTY_DISTRIBUTION,
  ) as GeneratedDifficulty[]) {
    for (let i = 0; i < REQUIRED_DIFFICULTY_DISTRIBUTION[difficulty]; i++) {
      questions.push(question(n++, difficulty));
    }
  }

  return { questions };
}

describe("generatedInterviewPoolSchema", () => {
  it("accepts a well-formed 30-question pool", () => {
    const parsed = generatedInterviewPoolSchema.safeParse(validPool());

    expect(parsed.success).toBe(true);
  });

  it("rejects an out-of-range correct option", () => {
    const pool = validPool();
    pool.questions[0].correctOption = 4;

    expect(generatedInterviewPoolSchema.safeParse(pool).success).toBe(false);
  });

  it("carries no array-length keywords into either provider's JSON schema", () => {
    for (const build of [toStrictJsonSchema, toGeminiResponseSchema]) {
      const json = JSON.stringify(build(generatedInterviewPoolSchema));

      expect(json).not.toContain("minItems");
      expect(json).not.toContain("maxItems");
    }
  });
});

describe("assertValidInterviewPool", () => {
  it("passes a pool with the exact difficulty distribution", () => {
    expect(() =>
      assertValidInterviewPool(
        generatedInterviewPoolSchema.parse(validPool()),
      ),
    ).not.toThrow();
  });

  it("throws on the wrong question count", () => {
    const short = generatedInterviewPoolSchema.parse(validPool());
    short.questions.pop();
    expect(() => assertValidInterviewPool(short)).toThrow(/30 questions/);

    const long = generatedInterviewPoolSchema.parse(validPool());
    long.questions.push(question(31, "easy"));
    expect(() => assertValidInterviewPool(long)).toThrow(/30 questions/);
  });

  it("throws when a question does not have exactly four options", () => {
    const pool = generatedInterviewPoolSchema.parse(validPool());
    pool.questions[0].options = ["only", "three", "options"];

    expect(() => assertValidInterviewPool(pool)).toThrow(/4 options/);
  });

  it("tolerates a non-standard but usable difficulty spread", () => {
    const pool = generatedInterviewPoolSchema.parse(validPool());
    pool.questions[0].difficulty = "hard";
    pool.questions[1].difficulty = "hard";
    pool.questions[2].difficulty = "challenging";

    expect(() => assertValidInterviewPool(pool)).not.toThrow();
  });

  it("throws when a difficulty band is nearly empty", () => {
    const pool = generatedInterviewPoolSchema.parse(validPool());

    for (const q of pool.questions) {
      if (q.difficulty === "easy") {
        q.difficulty = "hard";
      }
    }
    pool.questions[0].difficulty = "easy";

    expect(() => assertValidInterviewPool(pool)).toThrow(/spread is unusable/);
  });

  it("throws when one difficulty dominates the pool", () => {
    const pool = generatedInterviewPoolSchema.parse(validPool());

    for (const q of pool.questions) {
      q.difficulty = "hard";
    }
    pool.questions[0].difficulty = "easy";
    pool.questions[1].difficulty = "challenging";
    pool.questions[2].difficulty = "very_hard";

    expect(() => assertValidInterviewPool(pool)).toThrow(/spread is unusable/);
  });

  it("throws on a duplicated question", () => {
    const pool = generatedInterviewPoolSchema.parse(validPool());
    pool.questions[1].question = pool.questions[0].question;
    pool.questions[1].difficulty = pool.questions[0].difficulty;
    pool.questions[0].difficulty = "challenging";

    expect(() => assertValidInterviewPool(pool)).toThrow(/duplicate/);
  });
});

describe("MockApplicationIntelligenceProvider.generateInterviewPool", () => {
  it("returns a pool that satisfies the schema and the distribution", async () => {
    const result = await new MockApplicationIntelligenceProvider().generateInterviewPool(
      {
        roleFamily: "frontend-engineering",
        seniorityBand: "senior",
        coreSkills: ["react", "typescript"],
        secondarySkills: ["css"],
        topics: ["state management", "accessibility"],
        responsibilities: [],
        targetRequirements: [],
      },
    );

    const pool = generatedInterviewPoolSchema.parse(
      JSON.parse(result.rawResponse as string),
    );

    expect(() => assertValidInterviewPool(pool)).not.toThrow();
    expect(pool.questions).toHaveLength(30);
  });
});

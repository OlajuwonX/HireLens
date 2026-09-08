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

  it("rejects the wrong question count", () => {
    const short = validPool();
    short.questions.pop();

    expect(generatedInterviewPoolSchema.safeParse(short).success).toBe(false);

    const long = validPool();
    long.questions.push(question(31, "easy"));

    expect(generatedInterviewPoolSchema.safeParse(long).success).toBe(false);
  });

  it("rejects a question without exactly four options", () => {
    const pool = validPool();
    pool.questions[0].options = ["only", "three", "options"];

    expect(generatedInterviewPoolSchema.safeParse(pool).success).toBe(false);
  });

  it("rejects an out-of-range correct option", () => {
    const pool = validPool();
    pool.questions[0].correctOption = 4;

    expect(generatedInterviewPoolSchema.safeParse(pool).success).toBe(false);
  });

  it("converts to a JSON schema for both providers without throwing", () => {
    expect(() => toStrictJsonSchema(generatedInterviewPoolSchema)).not.toThrow();
    expect(() =>
      toGeminiResponseSchema(generatedInterviewPoolSchema),
    ).not.toThrow();
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

  it("throws when the difficulty distribution is off", () => {
    const pool = generatedInterviewPoolSchema.parse(validPool());
    pool.questions[0].difficulty = "challenging";

    expect(() => assertValidInterviewPool(pool)).toThrow(/distribution/);
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

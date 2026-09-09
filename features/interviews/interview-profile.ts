import {
  containsIdentifiableContent,
  hashAnalysisInput,
  scrubIdentifiableContent,
} from "@/lib/ai";
import type { StoredApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";
import {
  INTERVIEW_CORE_SKILL_COUNT,
  INTERVIEW_POOL_PROMPT_VERSION,
  INTERVIEW_RESPONSIBILITY_COUNT,
  INTERVIEW_SECONDARY_SKILL_COUNT,
  INTERVIEW_TARGET_REQUIREMENT_COUNT,
  type InterviewSeniorityBand,
} from "./constants";
import {
  normalizeSkill,
  normalizeTitle,
  resolveRoleFamily,
} from "./role-taxonomy";

export type InterviewProfileInput = {
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string | null;
  analysis: StoredApplicationIntelligence | null;
  resumeText: string | null;
};

export type InterviewProfile = {
  roleFamily: string;
  seniorityBand: InterviewSeniorityBand;
  coreSkills: string[];
  secondarySkills: string[];
  responsibilities: string[];
  targetRequirements: string[];
  topics: string[];
};

const SENIORITY_MARKERS: { band: InterviewSeniorityBand; tokens: string[] }[] = [
  {
    band: "principal",
    tokens: [
      "principal",
      "staff",
      "distinguished",
      "fellow",
      "head of",
      "director",
      "vp",
      "vice president",
      "chief",
    ],
  },
  {
    band: "senior",
    tokens: ["senior", "lead", "iii", "iv"],
  },
  {
    band: "entry",
    tokens: [
      "intern",
      "internship",
      "trainee",
      "graduate",
      "junior",
      "apprentice",
      "entry level",
    ],
  },
];

function deriveSeniority(
  title: string,
  headline: string,
  experienceCount: number,
): InterviewSeniorityBand {
  const haystack = `${normalizeTitle(title)} ${normalizeTitle(headline)}`;

  for (const marker of SENIORITY_MARKERS) {
    if (marker.tokens.some((token) => haystack.includes(token))) {
      return marker.band;
    }
  }

  if (/\bii\b/.test(haystack)) {
    return "mid";
  }

  return experienceCount >= 5 ? "senior" : "mid";
}

function isShortPhrase(value: string) {
  const words = value.trim().split(/\s+/);

  return words.length > 0 && words.length <= 3;
}

function rankByWeight(weights: Map<string, number>) {
  return [...weights.entries()].sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  });
}

function collectSkillWeights(input: InterviewProfileInput) {
  const weights = new Map<string, number>();
  const add = (raw: string, weight: number) => {
    const skill = normalizeSkill(raw);

    if (skill.length < 2 || skill.length > 40) {
      return;
    }

    weights.set(skill, (weights.get(skill) ?? 0) + weight);
  };

  const analysis = input.analysis;

  if (analysis) {
    for (const group of analysis.improvedResume.skills) {
      for (const item of group.items) {
        add(item, 3);
      }
    }

    for (const keyword of analysis.keywordAnalysis.present) {
      add(keyword, 3);
    }

    for (const entry of analysis.keywordAnalysis.transferable) {
      add(entry.required, 2);
    }

    for (const match of analysis.requirementMatches) {
      if (
        match.category === "SKILL" &&
        match.status !== "MISSING" &&
        isShortPhrase(match.requirement)
      ) {
        add(match.requirement, 2);
      }
    }
  }

  return weights;
}

function generalize(raw: string): string | null {
  const value = scrubIdentifiableContent(raw).slice(0, 160).trim();

  if (!value || containsIdentifiableContent(value)) {
    return null;
  }

  return value;
}

function deriveResponsibilities(analysis: StoredApplicationIntelligence | null) {
  if (!analysis) {
    return [];
  }

  const seen = new Set<string>();
  const responsibilities: string[] = [];

  for (const match of analysis.requirementMatches) {
    if (
      match.category !== "RESPONSIBILITY" ||
      match.status === "MISSING" ||
      match.status === "UNCLEAR"
    ) {
      continue;
    }

    const value = generalize(match.requirement);
    const key = value?.toLowerCase();

    if (!value || !key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    responsibilities.push(value);
  }

  return responsibilities.slice(0, INTERVIEW_RESPONSIBILITY_COUNT);
}

function deriveTargetRequirements(
  analysis: StoredApplicationIntelligence | null,
) {
  if (!analysis) {
    return [];
  }

  const seen = new Set<string>();
  const targets: string[] = [];
  const push = (raw: string) => {
    const value = generalize(raw);
    const key = value?.toLowerCase();

    if (!value || !key || seen.has(key)) {
      return;
    }

    seen.add(key);
    targets.push(value);
  };

  for (const match of analysis.requirementMatches) {
    if (match.status === "MISSING" && match.importance === "REQUIRED") {
      push(match.requirement);
    }
  }

  for (const entry of analysis.keywordAnalysis.missing) {
    if (entry.gapType === "QUALIFICATION_GAP") {
      push(entry.keyword);
    }
  }

  return targets.slice(0, INTERVIEW_TARGET_REQUIREMENT_COUNT);
}

export function buildInterviewProfile(
  input: InterviewProfileInput,
): InterviewProfile {
  const headline = input.analysis?.improvedResume.header.headline ?? "";
  const weights = collectSkillWeights(input);
  const ranked = rankByWeight(weights).map(([skill]) => skill);

  const coreSkills = [...ranked.slice(0, INTERVIEW_CORE_SKILL_COUNT)].sort();
  const secondarySkills = [
    ...ranked.slice(
      INTERVIEW_CORE_SKILL_COUNT,
      INTERVIEW_CORE_SKILL_COUNT + INTERVIEW_SECONDARY_SKILL_COUNT,
    ),
  ].sort();

  const jobText = [input.jobDescription, input.jobRequirements ?? ""]
    .join(" ")
    .trim();

  const resolution = resolveRoleFamily({
    title: input.jobTitle,
    headline,
    skills: ranked,
    jobText,
  });

  const experienceCount = input.analysis?.improvedResume.experience.length ?? 0;
  const seniorityBand = deriveSeniority(
    input.jobTitle,
    headline,
    experienceCount,
  );

  const topicSkills = coreSkills.slice(0, 4);
  const topics = [...new Set([...resolution.topics, ...topicSkills])].slice(
    0,
    10,
  );

  return {
    roleFamily: resolution.roleFamily,
    seniorityBand,
    coreSkills,
    secondarySkills,
    responsibilities: deriveResponsibilities(input.analysis),
    targetRequirements: deriveTargetRequirements(input.analysis),
    topics,
  };
}

export function interviewFingerprint(profile: InterviewProfile) {
  return hashAnalysisInput({
    kind: "interview-pool",
    promptVersion: INTERVIEW_POOL_PROMPT_VERSION,
    roleFamily: profile.roleFamily,
    seniorityBand: profile.seniorityBand,
    coreSkills: [...profile.coreSkills].sort(),
  });
}

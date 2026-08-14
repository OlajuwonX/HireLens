import {
  storedApplicationIntelligenceSchema,
  type StoredApplicationIntelligence,
} from "@/lib/ai/schemas/application-intelligence.schema";
import type {
  ApplicationAnalysis,
  UserEvidenceCorrection,
} from "@/lib/db/schema";

export const AI_VIEWS = [
  "RECOMMENDATIONS",
  "KEYWORD_ANALYSIS",
  "IMPROVED_RESUME",
  "BULLET_REWRITE",
  "PROFESSIONAL_SUMMARY",
  "COVER_LETTER",
  "APPLICATION_EMAIL",
  "FOLLOW_UP_MESSAGE",
] as const;

export type AiView = (typeof AI_VIEWS)[number];

export const aiViewLabels: Record<AiView, string> = {
  RECOMMENDATIONS: "Recommendations",
  KEYWORD_ANALYSIS: "Keyword gaps",
  IMPROVED_RESUME: "Improved resume",
  BULLET_REWRITE: "Bullet rewrites",
  PROFESSIONAL_SUMMARY: "Professional summary",
  COVER_LETTER: "Cover letter",
  APPLICATION_EMAIL: "Application email",
  FOLLOW_UP_MESSAGE: "Follow-up message",
};

export function readStoredIntelligence(
  analysis: Pick<ApplicationAnalysis, "resultJson" | "status">,
): StoredApplicationIntelligence | null {
  if (analysis.status !== "SUCCEEDED" || !analysis.resultJson) {
    return null;
  }

  const parsed = storedApplicationIntelligenceSchema.safeParse(
    analysis.resultJson,
  );

  return parsed.success ? parsed.data : null;
}

export function viewIsPopulated(
  result: StoredApplicationIntelligence,
  view: AiView,
) {
  switch (view) {
    case "RECOMMENDATIONS":
      return result.recommendations.length > 0;
    case "KEYWORD_ANALYSIS":
      return (
        result.keywordAnalysis.present.length > 0 ||
        result.keywordAnalysis.transferable.length > 0 ||
        result.keywordAnalysis.missing.length > 0
      );
    case "IMPROVED_RESUME":
      return result.improvedResume.experience.length > 0;
    case "BULLET_REWRITE":
      return result.bulletRewrites.length > 0;
    case "PROFESSIONAL_SUMMARY":
      return result.professionalSummary.length > 0;
    case "COVER_LETTER":
      return result.coverLetter.length > 0;
    case "APPLICATION_EMAIL":
      return result.applicationEmail.body.length > 0;
    case "FOLLOW_UP_MESSAGE":
      return result.followUpMessage.length > 0;
  }
}

export function viewToPlainText(
  result: StoredApplicationIntelligence,
  view: AiView,
): string {
  switch (view) {
    case "RECOMMENDATIONS":
      return result.recommendations
        .map((item) =>
          [
            `[${item.priority}] ${item.problem}`,
            item.evidence ? `Evidence: ${item.evidence}` : null,
            `Action: ${item.recommendedAction}`,
            `Why: ${item.reason}`,
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n");
    case "KEYWORD_ANALYSIS": {
      const { present, transferable, missing, avoidForcing } =
        result.keywordAnalysis;

      return [
        present.length ? `PRESENT\n${present.join(", ")}` : null,
        transferable.length
          ? `TRANSFERABLE\n${transferable
              .map((item) => `${item.required} <- ${item.existingEvidence}`)
              .join("\n")}`
          : null,
        missing.length
          ? `MISSING\n${missing
              .map(
                (item) =>
                  `${item.keyword} (${item.gapType}): ${item.explanation}`,
              )
              .join("\n")}`
          : null,
        avoidForcing.length
          ? `AVOID FORCING\n${avoidForcing.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n\n");
    }
    case "BULLET_REWRITE":
      return result.bulletRewrites
        .map((item) =>
          [
            `Before: ${item.original}`,
            `After: ${item.improved}`,
            `Why: ${item.reason}`,
          ].join("\n"),
        )
        .join("\n\n");
    case "PROFESSIONAL_SUMMARY":
      return result.professionalSummary;
    case "COVER_LETTER":
      return result.coverLetter;
    case "APPLICATION_EMAIL":
      return [
        `Subject: ${result.applicationEmail.subject}`,
        "",
        result.applicationEmail.body,
      ].join("\n");
    case "FOLLOW_UP_MESSAGE":
      return result.followUpMessage;
    case "IMPROVED_RESUME":
      return improvedResumeToText(result.improvedResume);
  }
}

export function improvedResumeToText(
  resume: StoredApplicationIntelligence["improvedResume"],
) {
  const lines: string[] = [resume.header.name, resume.header.headline];

  const contact = [
    resume.header.email,
    resume.header.phone,
    resume.header.location,
    ...resume.header.links,
  ].filter(Boolean);

  if (contact.length > 0) {
    lines.push(contact.join(" | "));
  }

  if (resume.professionalSummary) {
    lines.push("", "SUMMARY", resume.professionalSummary);
  }

  if (resume.skills.length > 0) {
    lines.push("", "SKILLS");

    for (const group of resume.skills) {
      lines.push(`${group.category}: ${group.items.join(", ")}`);
    }
  }

  if (resume.experience.length > 0) {
    lines.push("", "EXPERIENCE");

    for (const entry of resume.experience) {
      const dates = [entry.startDate, entry.endDate]
        .filter(Boolean)
        .join(" - ");
      const context = [entry.company, entry.location]
        .filter(Boolean)
        .join(" - ");

      lines.push("", [entry.title, dates].filter(Boolean).join("  "));

      if (context) {
        lines.push(context);
      }

      for (const bullet of entry.bullets) {
        lines.push(`- ${bullet}`);
      }
    }
  }

  if (resume.projects.length > 0) {
    lines.push("", "PROJECTS");

    for (const project of resume.projects) {
      lines.push("", project.name);

      if (project.technologies.length > 0) {
        lines.push(project.technologies.join(", "));
      }

      for (const bullet of project.bullets) {
        lines.push(`- ${bullet}`);
      }
    }
  }

  if (resume.education.length > 0) {
    lines.push("", "EDUCATION");

    for (const entry of resume.education) {
      lines.push(
        "",
        [entry.qualification, entry.date].filter(Boolean).join("  "),
        entry.institution,
      );
    }
  }

  return lines.join("\n");
}

export function mergeCorrections(
  result: StoredApplicationIntelligence,
  corrections: UserEvidenceCorrection[],
) {
  const byKey = new Map(
    corrections.map((correction) => [correction.requirementKey, correction]),
  );

  return result.requirementMatches.map((match) => ({
    match,
    correction: byKey.get(match.key) ?? null,
  }));
}

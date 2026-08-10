import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";

export function improvedResumeToText(resume: ImprovedResume) {
  const lines: string[] = [resume.fullName, resume.headline];

  const contact = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    ...resume.contact.links,
  ].filter(Boolean);

  if (contact.length > 0) {
    lines.push(contact.join(" | "));
  }

  lines.push("", "SUMMARY", resume.summary);

  if (resume.skills.length > 0) {
    lines.push("", "SKILLS");

    for (const group of resume.skills) {
      lines.push(`${group.category}: ${group.items.join(", ")}`);
    }
  }

  if (resume.experience.length > 0) {
    lines.push("", "EXPERIENCE");

    for (const entry of resume.experience) {
      const dates = [entry.startDate, entry.endDate ?? "Present"]
        .filter(Boolean)
        .join(" - ");
      const context = [entry.organisation, entry.location]
        .filter(Boolean)
        .join(" - ");

      lines.push("", [entry.role, dates].filter(Boolean).join("  "));

      if (context) {
        lines.push(context);
      }

      for (const bullet of entry.bullets) {
        lines.push(`- ${bullet}`);
      }
    }
  }

  if (resume.education.length > 0) {
    lines.push("", "EDUCATION");

    for (const entry of resume.education) {
      lines.push(
        "",
        [entry.credential, entry.completedOn].filter(Boolean).join("  "),
      );
      lines.push([entry.institution, entry.location].filter(Boolean).join(" - "));

      if (entry.detail) {
        lines.push(entry.detail);
      }
    }
  }

  if (resume.certifications.length > 0) {
    lines.push("", "CERTIFICATIONS");

    for (const certification of resume.certifications) {
      lines.push(`- ${certification}`);
    }
  }

  if (resume.changeNotes.length > 0) {
    lines.push("", "WHAT CHANGED");

    for (const note of resume.changeNotes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}

export function improvedResumeFilename(fullName: string, jobTitle: string) {
  const slug = [fullName, jobTitle]
    .join("-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase();

  return `${slug || "improved-resume"}.pdf`;
}

export function improvedResumeVersionLabel(jobTitle: string | null) {
  const suffix = jobTitle ? ` - ${jobTitle}` : "";

  return `AI-assisted${suffix}`.slice(0, 120);
}

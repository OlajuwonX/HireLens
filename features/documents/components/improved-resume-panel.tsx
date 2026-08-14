import type { ReactNode } from "react";
import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="font-mono text-system font-medium uppercase text-text-muted">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function ImprovedResumePanel({ resume }: { resume: ImprovedResume }) {
  const contact = [
    resume.header.email,
    resume.header.phone,
    resume.header.location,
    ...resume.header.links,
  ].filter(Boolean);

  if (!resume.header.name && resume.experience.length === 0) {
    return (
      <p className="text-meta text-text-secondary">
        No improved resume was returned for this application.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-section-title font-semibold text-text-primary">
          {resume.header.name}
        </p>
        <p className="text-meta text-text-secondary">
          {resume.header.headline}
        </p>
        {contact.length > 0 ? (
          <p className="text-label text-text-muted">{contact.join("  |  ")}</p>
        ) : null}
      </header>

      {resume.professionalSummary ? (
        <Section title="Summary">
          <p className="text-meta leading-relaxed text-text-primary">
            {resume.professionalSummary}
          </p>
        </Section>
      ) : null}

      {resume.skills.length > 0 ? (
        <Section title="Skills">
          <ul className="space-y-1">
            {resume.skills.map((group) => (
              <li key={group.category} className="text-meta text-text-primary">
                <span className="font-medium">{group.category}: </span>
                {group.items.join(", ")}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {resume.experience.length > 0 ? (
        <Section title="Experience">
          <ul className="space-y-4">
            {resume.experience.map((entry, index) => (
              <li key={`${index}-${entry.company}`} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-meta font-medium text-text-primary">
                    {entry.title}
                  </p>
                  <p className="font-mono text-system text-text-muted">
                    {[entry.startDate, entry.endDate]
                      .filter(Boolean)
                      .join(" - ")}
                  </p>
                </div>
                <p className="text-label text-text-secondary">
                  {[entry.company, entry.location].filter(Boolean).join(" - ")}
                </p>
                <ul className="space-y-1">
                  {entry.bullets.map((bullet, bulletIndex) => (
                    <li
                      key={bulletIndex}
                      className="text-meta text-text-primary"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {resume.projects.length > 0 ? (
        <Section title="Projects">
          <ul className="space-y-3">
            {resume.projects.map((project) => (
              <li key={project.name} className="space-y-1">
                <p className="text-meta font-medium text-text-primary">
                  {project.name}
                </p>
                {project.technologies.length > 0 ? (
                  <p className="text-label text-text-muted">
                    {project.technologies.join(", ")}
                  </p>
                ) : null}
                <ul className="space-y-1">
                  {project.bullets.map((bullet, index) => (
                    <li key={index} className="text-meta text-text-primary">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {resume.education.length > 0 ? (
        <Section title="Education">
          <ul className="space-y-2">
            {resume.education.map((entry, index) => (
              <li key={`${index}-${entry.institution}`}>
                <p className="text-meta font-medium text-text-primary">
                  {entry.qualification}
                </p>
                <p className="text-label text-text-secondary">
                  {[entry.institution, entry.date].filter(Boolean).join(" - ")}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

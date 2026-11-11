import type { ResumeValidation } from "@/lib/ai/schemas/resume-validation.schema";

export function FactCheckList({
  validation,
}: {
  validation: ResumeValidation | null;
}) {
  if (!validation) {
    return null;
  }

  return (
    <section className="space-y-2 border-t border-border pt-4">
      <h4 className="font-mono text-system font-medium uppercase text-text-muted">
        Automatic fact check
      </h4>
      {validation.issues.length === 0 ? (
        <p className="text-meta text-text-secondary">
          Every number, date and skill was found in your original resume.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {validation.issues.map((issue) => (
            <li key={issue.code} className="flex gap-2 text-meta">
              <span
                className={
                  issue.severity === "ERROR"
                    ? "font-medium text-danger"
                    : "font-medium text-text-muted"
                }
              >
                {issue.severity === "ERROR" ? "Check" : "Note"}
              </span>
              <span className="text-text-primary">{issue.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

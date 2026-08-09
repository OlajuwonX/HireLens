import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "HireLens — Build a stronger application for every job you want",
};

const capabilities = [
  {
    title: "Resume analysis",
    description: "See where your resume matches — and where it doesn't.",
  },
  {
    title: "Job targeting",
    description: "Turn job descriptions into clear requirements.",
  },
  {
    title: "Application documents",
    description: "Generate tailored cover letters and follow-ups.",
  },
  {
    title: "Tracking",
    description: "Save opportunities and follow them from discovery to offer.",
  },
];

const previewScores = [
  { label: "ATS compatibility", value: 87 },
  { label: "Required skills", value: 91 },
  { label: "Experience alignment", value: 78 },
  { label: "Preferred skills", value: 63 },
];

function DashboardPreview() {
  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <p className="font-mono text-system font-medium uppercase text-text-muted">
        Job fit
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-card-metric font-semibold text-text-primary">
          82
        </span>
        <span className="text-meta text-text-muted">/ 100</span>
      </div>
      <p className="mt-1 text-meta text-text-secondary">Strong match</p>
      <div className="mt-4 h-1.5 w-full overflow-hidden bg-surface-elevated">
        <div className="h-full w-[82%] bg-accent" />
      </div>
      <dl className="mt-6">
        {previewScores.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0"
          >
            <dt className="text-meta text-text-secondary">{row.label}</dt>
            <dd className="font-mono text-meta font-medium tabular-nums text-text-primary">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-page items-center justify-between px-6">
          <span className="text-section-title font-semibold text-text-primary">
            HireLens
          </span>
          <Button asChild variant="ghost" size="compact">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-page px-6">
        <section className="grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <h1 className="text-display font-semibold text-text-primary">
              Build a stronger application for every job you want.
            </h1>
            <p className="mt-6 max-w-reading text-body text-text-secondary">
              Analyze your resume against real job requirements, spot missing
              evidence, generate tailored application documents and track
              everything from one workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="primary">
                <Link href="/sign-up">Create free account</Link>
              </Button>
              <Button asChild variant="outline" size="primary">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
          <DashboardPreview />
        </section>

        <section className="border-t border-border py-16">
          <h2 className="text-page-title font-semibold text-text-primary">
            One workspace.
            <br />
            Every application.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item.title} className="bg-surface p-6">
                <h3 className="text-section-title font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-meta text-text-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-16">
          <h2 className="text-page-title font-semibold text-text-primary">
            Built around your actual experience.
          </h2>
          <p className="mt-4 max-w-reading text-body text-text-secondary">
            HireLens helps you improve how your experience is presented. It
            never needs to invent qualifications, employers or achievements.
          </p>
        </section>

        <section className="border-t border-border py-16">
          <h2 className="text-page-title font-semibold text-text-primary">
            Ready to sharpen your next application?
          </h2>
          <div className="mt-6">
            <Button asChild size="primary">
              <Link href="/sign-up">Create free account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-page px-6 py-8">
          <p className="font-mono text-system text-text-muted">HireLens</p>
        </div>
      </footer>
    </div>
  );
}

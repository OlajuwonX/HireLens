import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { MatchPanel } from "@/components/data-display/match-panel";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo/site";
import { FAQ, buildStructuredData } from "@/lib/seo/structured-data";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const capabilities = [
  {
    title: "Resume analysis",
    description:
      "See where your resume matches a posting and where the evidence is missing.",
  },
  {
    title: "Job targeting",
    description: "Turn a job description into clear, checkable requirements.",
  },
  {
    title: "Application documents",
    description:
      "Generate tailored cover letters, outreach emails and follow-ups.",
  },
  {
    title: "Tracking",
    description: "Save opportunities and follow them from discovery to offer.",
  },
];

const steps = [
  {
    title: "Add your resume",
    description:
      "Upload it once. Keep as many versions as you need, and pick the right one per application.",
  },
  {
    title: "Paste the job posting",
    description:
      "HireLens reads the posting and pulls out the title, company and requirements for you.",
  },
  {
    title: "Read one analysis",
    description:
      "A job fit score, ATS compatibility, matched requirements and the gaps worth closing.",
  },
  {
    title: "Open what you need",
    description:
      "Cover letter, improved resume, keyword gaps and follow-ups, all from that one analysis.",
  },
];

const previewParts = [
  { label: "Requirements", score: 88 },
  { label: "Skills", score: 91 },
  { label: "Experience", score: 78 },
  { label: "Keywords", score: 57 },
  { label: "ATS readability", score: 87 },
];

export default function HomePage() {
  const structuredData = buildStructuredData();

  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <SiteHeader />

      <main className="mx-auto w-full max-w-page px-6">
        <section className="grid gap-8 py-10 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-24">
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
            <p className="mt-4 text-label text-text-muted">
              Free to use. No card required.
            </p>
          </div>
          <MatchPanel context="Senior Frontend Engineer" total={82} parts={previewParts} />
        </section>

        <section
          id="features"
          aria-labelledby="features-heading"
          className="scroll-mt-20 border-t border-border py-10 sm:py-16"
        >
          <h2
            id="features-heading"
            className="text-page-title font-semibold text-text-primary"
          >
            One workspace.
            <br />
            Every application.
          </h2>
          <div className="mt-6 grid gap-px sm:mt-10 overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
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

        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="scroll-mt-20 border-t border-border py-10 sm:py-16"
        >
          <h2
            id="how-it-works-heading"
            className="text-page-title font-semibold text-text-primary"
          >
            How it works
          </h2>
          <p className="mt-4 max-w-reading text-body text-text-secondary">
            One analysis per job. Everything else reads from it, so nothing is
            generated twice.
          </p>
          <ol className="mt-6 grid gap-px sm:mt-10 overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="bg-surface p-6">
                <p className="font-mono text-system font-medium text-text-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-section-title font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-meta text-text-secondary">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="honesty-heading"
          className="border-t border-border py-10 sm:py-16"
        >
          <h2
            id="honesty-heading"
            className="text-page-title font-semibold text-text-primary"
          >
            Built around your actual experience.
          </h2>
          <p className="mt-4 max-w-reading text-body text-text-secondary">
            HireLens helps you improve how your experience is presented. It
            never needs to invent qualifications, employers or achievements.
            Where a figure would strengthen a bullet and you have not supplied
            one, it leaves a clearly marked placeholder for you to fill in.
          </p>
        </section>

        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="scroll-mt-20 border-t border-border py-10 sm:py-16"
        >
          <h2
            id="faq-heading"
            className="text-page-title font-semibold text-text-primary"
          >
            Common questions
          </h2>
          <dl className="mt-6 grid gap-px sm:mt-10 overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.question} className="bg-surface p-6">
                <dt className="text-section-title font-semibold text-text-primary">
                  {item.question}
                </dt>
                <dd className="mt-2 text-meta text-text-secondary">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="cta-heading"
          className="border-t border-border py-10 sm:py-16"
        >
          <h2
            id="cta-heading"
            className="text-page-title font-semibold text-text-primary"
          >
            Ready to sharpen your next application?
          </h2>
          <div className="mt-6">
            <Button asChild size="primary">
              <Link href="/sign-up">Create free account</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

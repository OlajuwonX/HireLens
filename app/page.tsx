import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { MatchPanel } from "@/components/data-display/match-panel";
import { BuilderSection } from "@/components/marketing/builder-section";
import { StoryScroll } from "@/components/marketing/story/story-scroll";
import { storyJob, storyParts } from "@/components/marketing/story/visuals/early";
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
            <h1 className="text-display font-semibold text-text-primary motion-safe:rise-in">
              Build a stronger application for every job you want.
            </h1>
            <p className="mt-6 max-w-reading text-body text-text-secondary motion-safe:rise-in [--rise:1]">
              Analyze your resume against real job requirements, spot missing
              evidence, generate tailored application documents and track
              everything from one workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 motion-safe:rise-in [--rise:2]">
              <Button asChild size="primary">
                <Link href="/sign-up">Create free account</Link>
              </Button>
              <Button asChild variant="outline" size="primary">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
            <p className="mt-4 text-label text-text-muted motion-safe:rise-in [--rise:3]">
              Free to use. No card required.
            </p>
          </div>
          <MatchPanel
            context={`${storyJob.title} · ${storyJob.company}`}
            total={82}
            parts={storyParts}
            className="motion-safe:rise-in [--rise:2]"
          />
        </section>

        <StoryScroll />

        <BuilderSection />

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

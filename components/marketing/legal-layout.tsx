import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

type LegalLayoutProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-page px-6 py-16">
        <h1 className="text-page-title font-semibold text-text-primary">
          {title}
        </h1>
        <p className="mt-2 font-mono text-system uppercase text-text-muted">
          Last updated {updated}
        </p>
        <div className="mt-10 max-w-reading space-y-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-section-title font-semibold text-text-primary">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 text-body text-text-secondary">
        {children}
      </div>
    </section>
  );
}

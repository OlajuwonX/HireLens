import { Button } from "@/components/ui/button";
import { AUTHOR } from "@/lib/seo/site";
import Link from "next/link";

const principles = [
  {
    title: "Built from my own search",
    body: "Every feature started as something I needed while applying for roles. HireLens grows as I grow as an engineer.",
  },
  {
    title: "Honest by design",
    body: "The AI improves how your experience reads. It never invents employers, titles or results.",
  },
  {
    title: "Free to run",
    body: "Every service behind HireLens has a free tier, so it costs you nothing to use.",
  },
  {
    title: "Shipped in small steps",
    body: "Each change lands as one tested phase. Over two thousand automated tests run before anything goes live.",
  },
];

const stack = ["Next.js", "TypeScript", "Postgres on Neon", "Drizzle", "Gemini", "Tailwind CSS", "GSAP", "Vitest"];

const links = [
  { label: "GitHub", href: AUTHOR.github },
  { label: "LinkedIn", href: AUTHOR.linkedin },
  { label: "Website", href: AUTHOR.url },
];

export function BuilderSection() {
  return (
    <section
      id="builder"
      aria-labelledby="builder-heading"
      className="scroll-mt-20 border-t border-border py-10 sm:py-16"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
        <div>
          <p className="font-mono text-system font-medium uppercase text-text-muted">Built in public</p>
          <h2 id="builder-heading" className="mt-3 text-page-title font-semibold text-text-primary">
            One engineer, one job search, one tool that keeps getting better.
          </h2>
          <p className="mt-4 max-w-reading text-body text-text-secondary">
            I am {AUTHOR.name}. HireLens is where my growth in tech shows up in practice: each new skill I pick up becomes
            a feature here first.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map((link) => (
              <Button key={link.label} asChild variant="outline" size="compact">
                <Link href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <dl className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
            {principles.map((item) => (
              <div key={item.title} className="bg-surface p-5">
                <dt className="text-section-title font-semibold text-text-primary">{item.title}</dt>
                <dd className="mt-2 text-meta text-text-secondary">{item.body}</dd>
              </div>
            ))}
          </dl>
          <ul aria-label="Built with" className="flex flex-wrap gap-x-5 gap-y-2">
            {stack.map((name) => (
              <li key={name} className="font-mono text-system uppercase text-text-muted">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

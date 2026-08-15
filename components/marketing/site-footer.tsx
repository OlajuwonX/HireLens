import { AUTHOR } from "@/lib/seo/site";
import Link from "next/link";

const product = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Questions", href: "/#faq" },
  { label: "Help", href: "/dashboard/help" },
];

const legal = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const author = [
  { label: "GitHub", href: AUTHOR.github },
  { label: "LinkedIn", href: AUTHOR.linkedin },
  { label: "X", href: AUTHOR.x },
  { label: "Website", href: AUTHOR.url },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-page px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-section-title font-semibold text-text-primary">
              HireLens
            </p>
            <p className="mt-2 max-w-reading text-meta text-text-secondary">
              AI-powered tools for a better job search.
            </p>
          </div>

          <nav aria-labelledby="footer-product">
            <h2
              id="footer-product"
              className="font-mono text-system font-medium uppercase text-text-muted"
            >
              Product
            </h2>
            <ul className="mt-3 space-y-2">
              {product.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-meta text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2
              id="footer-legal"
              className="font-mono text-system font-medium uppercase text-text-muted"
            >
              Legal
            </h2>
            <ul className="mt-3 space-y-2">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-meta text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-system text-text-muted">
            © 2026 HireLens
          </p>

          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-label text-text-secondary">
              Built by{" "}
              <a
                href={AUTHOR.url}
                target="_blank"
                rel="noopener noreferrer me"
                className="font-medium text-text-primary underline-offset-4 hover:underline"
              >
                {AUTHOR.name}
              </a>
            </p>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {author.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="text-label text-text-muted transition-colors hover:text-text-secondary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

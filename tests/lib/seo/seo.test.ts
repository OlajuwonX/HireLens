import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    return statSync(full).isDirectory()
      ? walk(full)
      : /\.tsx?$/.test(entry)
        ? [full]
        : [];
  });
}

describe("the site is discoverable", () => {
  it("ships robots, sitemap, manifest and an OG image", () => {
    for (const file of [
      "app/robots.ts",
      "app/sitemap.ts",
      "app/manifest.ts",
      "app/opengraph-image.tsx",
    ]) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("ships the icons the browser and the OS ask for", () => {
    for (const file of [
      "app/icon.png",
      "app/apple-icon.png",
      "public/icon-192.png",
      "public/icon-512.png",
    ]) {
      expect(statSync(file).size).toBeGreaterThan(0);
    }
  });

  it("keeps the favicon small enough to be free", () => {
    expect(statSync("app/icon.png").size).toBeLessThan(20_000);
  });
});

describe("robots keeps crawlers out of the private app", () => {
  const robots = read("app/robots.ts");

  it.each([
    "/api/",
    "/dashboard",
    "/settings",
    "/ops-console",
    "/sign-in",
    "/sign-up",
  ])("disallows %s", (path) => {
    expect(robots).toContain(`"${path}"`);
  });

  it("points at the sitemap", () => {
    expect(robots).toContain("sitemap");
    expect(robots).toContain("/sitemap.xml");
  });
});

describe("the sitemap lists only public pages", () => {
  const sitemap = read("app/sitemap.ts");

  it("includes the marketing and legal routes", () => {
    for (const path of ['absoluteUrl("/")', "/privacy", "/terms"]) {
      expect(sitemap).toContain(path);
    }
  });

  it("never advertises an authenticated route", () => {
    for (const path of ["/dashboard", "/settings", "/ops-console"]) {
      expect(sitemap).not.toContain(path);
    }
  });
});

describe("the root metadata is complete", () => {
  const layout = read("app/layout.tsx");

  it.each([
    "metadataBase",
    "openGraph",
    "twitter",
    "alternates",
    "canonical",
    "robots",
    "description",
  ])("declares %s", (key) => {
    expect(layout).toContain(key);
  });

  it("uses a large summary card so the OG image is used", () => {
    expect(layout).toContain("summary_large_image");
  });

  it("wires Google Search Console verification through the environment", () => {
    expect(layout).toContain("getGoogleSiteVerification");
    expect(layout).toContain("verification: { google:");
  });
});

describe("Google verification and analytics stay out of the source", () => {
  it("never hardcodes a measurement id", () => {
    const sources = ["app", "components", "lib"].flatMap((root) => walk(root));

    const offenders = sources.filter((file) => {
      const source = read(file);

      return (
        /["']G-[A-Z0-9]{6,}["']/.test(source) ||
        /["']GTM-[A-Z0-9]{5,}["']/.test(source)
      );
    });

    expect(offenders).toEqual([]);
  });

  it("reads both Google values from the server environment", () => {
    const site = read("lib/seo/site.ts");

    expect(site).toContain("GOOGLE_SITE_VERIFICATION");
    expect(site).toContain("GOOGLE_ANALYTICS_ID");
    expect(site).toContain('import "server-only"');
  });

  it("renders no analytics tag when the id is absent", () => {
    const analytics = read("components/analytics/google-analytics.tsx");

    expect(analytics).toContain("return null");
  });
});

describe("structured data is valid and complete", () => {
  const structured = read("lib/seo/structured-data.ts");

  it.each(["WebSite", "SoftwareApplication", "FAQPage", "Person"])(
    "declares the %s type",
    (type) => {
      expect(structured).toContain(`"${type}"`);
    },
  );

  it("is injected into the landing page as ld+json", () => {
    const page = read("app/page.tsx");

    expect(page).toContain("application/ld+json");
    expect(page).toContain("buildStructuredData()");
  });
});

describe("the landing page is structured for search", () => {
  const page = read("app/page.tsx");

  it("has exactly one h1", () => {
    expect(page.match(/<h1/g)?.length).toBe(1);
  });

  it("gives every section a labelled heading", () => {
    const sections = page.match(/<section/g)?.length ?? 0;
    const labelled = page.match(/aria-labelledby=/g)?.length ?? 0;

    expect(sections).toBeGreaterThan(0);
    expect(labelled).toBe(sections - 1);
  });

  it("exposes the anchors the footer links to", () => {
    for (const id of ["features", "how-it-works", "faq"]) {
      expect(page).toContain(`id="${id}"`);
    }
  });
});

describe("marketing copy has no stray dashes", () => {
  const files = [
    "app/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "components/marketing/site-footer.tsx",
    "components/marketing/site-header.tsx",
    "components/marketing/legal-layout.tsx",
    "lib/seo/site.ts",
    "lib/seo/structured-data.ts",
  ];

  it.each(files)("%s uses no em dash or double hyphen", (file) => {
    const source = read(file);

    expect(source).not.toMatch(/—/);
    expect(source.replace(/^\s*\/\/.*$/gm, "")).not.toMatch(/\w\s--\s\w/);
  });
});

describe("the footer credits the author without impersonating the product", () => {
  const footer = read("components/marketing/site-footer.tsx");

  it("names the person, not a HireLens account", () => {
    expect(footer).toContain("Built by");
    expect(footer).toContain("AUTHOR.name");
  });

  it("links every requested profile", () => {
    for (const key of ["github", "linkedin", "x", "url"]) {
      expect(footer).toContain(`AUTHOR.${key}`);
    }
  });

  it("opens external profiles safely", () => {
    expect(footer).toContain('rel="noopener noreferrer me"');
  });

  it("carries the product and legal groups", () => {
    for (const label of [
      "Features",
      "How it works",
      "Help",
      "Privacy",
      "Terms",
      "© 2026 HireLens",
    ]) {
      expect(footer).toContain(label);
    }
  });
});

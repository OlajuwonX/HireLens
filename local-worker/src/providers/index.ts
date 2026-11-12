import type { Page } from "playwright-core";

export type Provider = {
  applyUrl: (jobUrl: string) => string;
  prepare: (page: Page) => Promise<void>;
};

const openApplyButton = async (page: Page) => {
  const apply = page.getByRole("button", { name: /^apply( for this job| now)?$/i }).first();

  if (await apply.isVisible().catch(() => false)) {
    await apply.click();
  }
};

const withSuffix = (suffix: string) => (jobUrl: string) => {
  const url = new URL(jobUrl);

  if (!url.pathname.endsWith(suffix)) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}${suffix}`;
  }

  return url.toString();
};

export const providers: Record<string, Provider> = {
  GREENHOUSE: { applyUrl: (url) => url, prepare: openApplyButton },
  LEVER: { applyUrl: withSuffix("/apply"), prepare: async () => undefined },
  ASHBY: { applyUrl: withSuffix("/application"), prepare: async () => undefined },
};

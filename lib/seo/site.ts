import "server-only";

import { getServerEnv } from "@/lib/env/server";

export const SITE_NAME = "HireLens";

export const SITE_TAGLINE =
  "Build a stronger application for every job you want";

export const SITE_TITLE = `${SITE_NAME} · ${SITE_TAGLINE}`;

export const SITE_DESCRIPTION =
  "HireLens analyzes your resume against real job requirements, shows where the evidence is missing, generates tailored cover letters and follow-ups, and tracks every application from one workspace.";

export const SITE_KEYWORDS = [
  "resume analysis",
  "ATS resume checker",
  "job application tracker",
  "AI cover letter generator",
  "resume job match score",
  "job search workspace",
];

export const AUTHOR = {
  name: "Phantom Dev",
  url: "https://Phantomx3.vercel.app",
  github: "https://github.com/OlajuwonX",
  linkedin: "https://www.linkedin.com/in/o-olasimbo-b986b7230/",
  x: "https://x.com/PhantomXDev?s=20",
} as const;

function normalize(value: string) {
  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const env = getServerEnv();

  const candidate =
    env.SITE_URL ?? env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;

  return candidate ? normalize(candidate) : "http://localhost:5000";
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getGoogleSiteVerification(): string | undefined {
  return getServerEnv().GOOGLE_SITE_VERIFICATION;
}

export function getGoogleAnalyticsId(): string | undefined {
  const id = getServerEnv().GOOGLE_ANALYTICS_ID;

  return id && /^G-[A-Z0-9]+$/i.test(id) ? id : undefined;
}

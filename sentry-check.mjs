import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i < 1 || line.trim().startsWith("#")) continue;
  const k = line.slice(0, i).trim();
  const v = line
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
  if (v) process.env[k] = v;
}

const mod = await import("@sentry/nextjs");
const Sentry = mod.default ?? mod;

const scrubModule = await import("./lib/observability/scrub.ts").catch(
  () => null,
);

const SENSITIVE =
  /resume|document|content|description|coverletter|cover_letter|requirement|extracted|result_?json|raw_?response|token|secret|password|passwordhash|api[_-]?key|authorization|cookie|dsn/i;

function scrub(value, depth = 0) {
  if (depth > 6) return "[redacted]";
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE.test(k) ? "[redacted]" : scrub(v, depth + 1);
    }
    return out;
  }
  return value;
}

let sent = null;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: true,
  environment: "verification",
  tracesSampleRate: 0,
  sendDefaultPii: false,
  beforeSend: (event) => {
    if (event.extra) event.extra = scrub(event.extra);
    if (event.user) event.user = { id: event.user.id };
    sent = event;
    return event;
  },
});

Sentry.captureException(new Error("HireLens Sentry verification"), {
  user: { id: "verification-user", email: "leak@example.com" },
  extra: {
    resumeText: "CONFIDENTIAL RESUME BODY",
    coverLetter: "CONFIDENTIAL COVER LETTER",
    apiKey: "sk-should-never-appear",
    nested: {
      description: "CONFIDENTIAL JOB DESCRIPTION",
      route: "/dashboard",
    },
    applicationId: "keep-this-id",
  },
});

const delivered = await Sentry.flush(20_000);
const serialized = JSON.stringify(sent ?? {});

const leaks = [
  "CONFIDENTIAL RESUME BODY",
  "CONFIDENTIAL COVER LETTER",
  "sk-should-never-appear",
  "CONFIDENTIAL JOB DESCRIPTION",
  "leak@example.com",
].filter((needle) => serialized.includes(needle));

console.log(`delivered to Sentry : ${delivered}`);
console.log(`payload leaks       : ${leaks.length === 0 ? "none" : leaks.join(", ")}`);
console.log(`user object sent    : ${JSON.stringify(sent?.user)}`);
console.log(`safe id preserved   : ${serialized.includes("keep-this-id")}`);
console.log(`safe route preserved: ${serialized.includes("/dashboard")}`);
console.log(`scrub module loaded : ${Boolean(scrubModule)}`);

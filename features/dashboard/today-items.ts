import { stageHref } from "@/features/applications/stages";

export type TodaySignals = {
  toApprove: number;
  needsYou: number;
  toReview: number;
  goodReplies: number;
  followUpsDue: number;
  newMatches: number;
  interviews: { publicId: string; company: string; at: Date }[];
};

export type TodayItem = {
  key: string;
  count: number | null;
  title: string;
  detail: string;
  href: string;
  urgent: boolean;
};

const rules = new Intl.PluralRules("en");

export function plural(count: number, one: string, other: string) {
  return `${count} ${rules.select(count) === "one" ? one : other}`;
}

export function interviewWhen(at: Date, now: Date) {
  const days = Math.round((startOfDay(at).getTime() - startOfDay(now).getTime()) / 86_400_000);
  const time = at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

  if (days === 0) return `today at ${time}`;
  if (days === 1) return `tomorrow at ${time}`;

  return `${at.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })} at ${time}`;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function buildTodayItems(signals: TodaySignals, now = new Date()): TodayItem[] {
  const items: TodayItem[] = signals.interviews.map((interview) => ({
    key: `interview-${interview.publicId}`,
    count: null,
    title: `Interview with ${interview.company}`,
    detail: `${interviewWhen(interview.at, now)}. Open your preparation brief.`,
    href: `/dashboard/jobs?open=${interview.publicId}`,
    urgent: true,
  }));

  const add = (item: Omit<TodayItem, "count" | "urgent"> & { count: number; urgent?: boolean }) => {
    if (item.count > 0) items.push({ urgent: false, ...item });
  };

  add({
    key: "good-replies",
    count: signals.goodReplies,
    title: plural(signals.goodReplies, "employer replied", "employers replied"),
    detail: "Interview invites, assessments or offers from the last week.",
    href: "/dashboard/responses",
    urgent: true,
  });
  add({
    key: "approve",
    count: signals.toApprove,
    title: plural(signals.toApprove, "application is ready to approve", "applications are ready to approve"),
    detail: "Check the answers, then approve to send.",
    href: stageHref("ready"),
  });
  add({
    key: "needs-you",
    count: signals.needsYou,
    title: plural(signals.needsYou, "application needs your input", "applications need your input"),
    detail: "A question HireLens could not answer truthfully, or a site it cannot fill.",
    href: stageHref("needs-you"),
  });
  add({
    key: "review",
    count: signals.toReview,
    title: plural(signals.toReview, "email to sort", "emails to sort"),
    detail: "HireLens was not sure whether these are about your applications.",
    href: "/dashboard/responses",
  });
  add({
    key: "follow-ups",
    count: signals.followUpsDue,
    title: plural(signals.followUpsDue, "follow-up is due", "follow-ups are due"),
    detail: "Applications you planned to chase.",
    href: "/dashboard/jobs",
  });
  add({
    key: "matches",
    count: signals.newMatches,
    title: plural(signals.newMatches, "new match", "new matches"),
    detail: "Jobs scored against your profile in the last two days.",
    href: "/dashboard/discover/matches",
  });

  return items.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}

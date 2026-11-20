import { isOpenToAnywhere, placesOverlap, regionsIn } from "./location";
import { levelFromSeniority, levelFromTitle, levelNames } from "./seniority";

export type EligibilityVerdict = "PASS" | "CHECK" | "FAIL";

export type EligibilityReason = {
  rule: "ARRANGEMENT" | "LOCATION" | "SENIORITY" | "SPONSORSHIP";
  verdict: Exclude<EligibilityVerdict, "PASS">;
  text: string;
};

export type EligibilityProfile = {
  seniority: string | null;
  currentLocation: string | null;
  targetLocations: string[];
  workArrangements: string[];
  authorizedCountries: string[];
  requiresSponsorship: boolean | null;
  willingToRelocate: boolean;
};

export type EligibilityPosting = {
  title: string;
  location: string | null;
  workArrangement: string;
  description: string;
};

const NO_SPONSORSHIP =
  /\b(no|not|unable to|cannot|can't|will not|won't|do not|does not)\s+(offer|provide)?\s*(visa\s+)?sponsor(ship)?\b|without\s+(the\s+need\s+for\s+)?(visa\s+)?sponsorship/i;

const label: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ON_SITE: "On-site" };

function arrangement(profile: EligibilityProfile, posting: EligibilityPosting): EligibilityReason[] {
  const wanted = profile.workArrangements;

  if (wanted.length === 0 || posting.workArrangement === "NOT_SPECIFIED" || wanted.includes(posting.workArrangement)) {
    return [];
  }

  return [{
    rule: "ARRANGEMENT",
    verdict: "FAIL",
    text: `${label[posting.workArrangement]} role; you prefer ${wanted.map((value) => label[value]).join(" or ")}.`,
  }];
}

function location(profile: EligibilityProfile, posting: EligibilityPosting): EligibilityReason[] {
  const place = posting.location;
  const yours = [profile.currentLocation, ...profile.targetLocations].filter(Boolean) as string[];

  if (!place || isOpenToAnywhere(place) || yours.length === 0) {
    return [];
  }

  if (posting.workArrangement === "REMOTE") {
    const limited = regionsIn(place);
    const allowed = [...profile.authorizedCountries, ...yours];

    return limited.length > 0 && !placesOverlap(place, allowed)
      ? [{ rule: "LOCATION", verdict: "CHECK", text: `Remote role limited to ${place}.` }]
      : [];
  }

  if (placesOverlap(place, yours)) {
    return [];
  }

  return [{
    rule: "LOCATION",
    verdict: profile.willingToRelocate ? "CHECK" : "FAIL",
    text: profile.willingToRelocate
      ? `Based in ${place}; you would need to relocate.`
      : `Based in ${place}, outside the locations you set.`,
  }];
}

function seniority(profile: EligibilityProfile, posting: EligibilityPosting): EligibilityReason[] {
  const yours = levelFromSeniority(profile.seniority);
  const theirs = levelFromTitle(posting.title);

  if (yours === null || theirs === null || Math.abs(theirs - yours) < 1) {
    return [];
  }

  const gap = Math.abs(theirs - yours);
  const direction = theirs > yours ? "above" : "below";

  return [{
    rule: "SENIORITY",
    verdict: gap >= 2 ? "FAIL" : "CHECK",
    text: `${levelNames[theirs]} role, ${gap === 1 ? "one level" : `${gap} levels`} ${direction} your ${levelNames[yours]} level.`,
  }];
}

function sponsorship(profile: EligibilityProfile, posting: EligibilityPosting): EligibilityReason[] {
  return profile.requiresSponsorship && NO_SPONSORSHIP.test(posting.description)
    ? [{ rule: "SPONSORSHIP", verdict: "FAIL", text: "The posting says it cannot sponsor visas." }]
    : [];
}

export function evaluateEligibility(profile: EligibilityProfile | null, posting: EligibilityPosting) {
  const reasons = profile
    ? [arrangement, location, seniority, sponsorship].flatMap((rule) => rule(profile, posting))
    : [];
  const verdict: EligibilityVerdict = reasons.some((reason) => reason.verdict === "FAIL")
    ? "FAIL"
    : reasons.length > 0
      ? "CHECK"
      : "PASS";

  return { verdict, reasons };
}

import { describe, expect, it } from "vitest";
import { classifyEmail } from "@/lib/responses/classify";
import { matchApplication, senderDomain, watchTerms } from "@/lib/responses/match";

const classify = (subject: string, text = "") => classifyEmail({ subject, text });

describe("classifyEmail", () => {
  it.each([
    ["We'd like to invite you to an interview", "", "INTERVIEW"],
    ["Next steps", "Please book a time via calendly.com/acme/30min", "INTERVIEW"],
    ["Your Acme coding assessment", "Complete the HackerRank test within 5 days.", "ASSESSMENT"],
    ["Quick chat?", "Could we set up an intro call this week?", "RECRUITER_SCREEN"],
    ["Offer of employment", "We are pleased to extend an offer.", "OFFER"],
    ["Thank you for applying to Acme", "We have received your application.", "ACKNOWLEDGEMENT"],
    ["Additional documents", "Could you please send your transcript?", "INFO_REQUEST"],
  ])("%s -> %s", (subject, text, kind) => {
    const result = classify(subject, text);

    expect(result.kind).toBe(kind);
    expect(result.needsReview).toBe(false);
  });

  it("reads a polite rejection as a rejection, not an acknowledgement", () => {
    const result = classify(
      "Your application to Acme",
      "Thank you for applying. Unfortunately, we have decided to move forward with other candidates.",
    );

    expect(result.kind).toBe("REJECTION");
  });

  it("sends an email that merely mentions interviews to review", () => {
    const result = classify("Newsletter", "Five tips for your next interview");

    expect(result).toMatchObject({ kind: "INTERVIEW", needsReview: true });
  });

  it("treats everything else as other, for review", () => {
    expect(classify("Lunch on Friday?")).toMatchObject({ kind: "OTHER", needsReview: true });
  });
});

describe("matchApplication", () => {
  const candidates = [
    { id: "a1", company: "Stripe, Inc.", title: "Frontend Engineer" },
    { id: "a2", company: "Acme Labs", title: "React Developer" },
    { id: "a3", company: "Acme Labs", title: "Product Designer" },
  ];

  it("matches by the company's own email domain", () => {
    expect(matchApplication({ from: "Jane <jane@stripe.com>", subject: "Hello", text: "" }, candidates)).toMatchObject({
      applicationId: "a1",
    });
  });

  it("matches job-board emails by the company name in the message", () => {
    const email = { from: "no-reply@greenhouse.io", subject: "Interview with Stripe", text: "" };

    expect(matchApplication(email, candidates)?.applicationId).toBe("a1");
  });

  it("uses the job title to pick between two roles at the same company", () => {
    const email = { from: "talent@acmelabs.com", subject: "Your React Developer application", text: "" };

    expect(matchApplication(email, candidates)?.applicationId).toBe("a2");
  });

  it("does not guess when nothing matches", () => {
    expect(matchApplication({ from: "x@unknown.com", subject: "Hi", text: "" }, candidates)).toBeNull();
  });

  it("extracts sender domains and watch terms", () => {
    expect(senderDomain("Recruiting <talent@Careers.Acme.com>")).toBe("careers.acme.com");
    expect(watchTerms(candidates)).toEqual(["stripe", "acme"]);
  });
});

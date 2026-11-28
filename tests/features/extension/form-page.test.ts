import { describe, expect, it } from "vitest";
import { descriptionSignals, isFormOnly } from "@/features/extension/form-page";

const walrusForm = `Employment Type, Location Type, Department, Engineering and product, Application, Autofill from resume.
Upload your resume here to autofill key application fields.
To filter out spam and low quality applications, this form asks some nontraditional questions that may take several minutes to fill out.
Name. What phone number can we reach you at? LinkedIn profile? Are you authorized to work in the United States? Yes, No.
Please submit a resume or CV. Submit Application, Powered by, Privacy Policy.`;

const raydarForm = `RemoteFull timeRAYDAR-WEB-232, APPLICATION, AUTOFILL APPLICATION.
Save time by importing your resume. * Required fields. Personal information, First name, Last name, Email, Headline (Optional), Phone (Optional).
Resume. Choose file or drag and drop here. Cover letter (Optional). Will you require work authorization of any kind? YES, NO, Submit application.`;

const description = `About the role. You will own features end to end across our web platform.
Responsibilities: build and ship product. Requirements: 5+ years of experience with React and TypeScript.
Nice to have: GraphQL. Benefits: remote work and equity.`;

describe("isFormOnly", () => {
  it("recognises application forms with no description", () => {
    expect(isFormOnly(walrusForm, 9)).toBe(true);
    expect(isFormOnly(raydarForm, 12)).toBe(true);
  });

  it("keeps pages that show the description above the form", () => {
    expect(descriptionSignals(description)).toBeGreaterThanOrEqual(2);
    expect(isFormOnly(`${description}\n${raydarForm}`, 12)).toBe(false);
  });

  it("never calls a page without fields a form", () => {
    expect(isFormOnly(walrusForm, 0)).toBe(false);
  });
});

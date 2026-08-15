import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalLayout,
  LegalSection,
} from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms you agree to when you use HireLens.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms" updated="August 2026">
      <LegalSection heading="What HireLens is">
        <p>
          HireLens is a tool that helps you prepare job applications. It is
          free to use and is offered as it is, without a guarantee of
          availability or of any particular outcome in your job search.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          Keep your sign-in details to yourself. You are responsible for what
          happens under your account, and you may close it at any time.
        </p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          Your resumes and the documents you generate remain yours. You give
          HireLens permission to store and process them only for the purpose of
          running the features you use.
        </p>
        <p>Upload only material you have the right to upload.</p>
      </LegalSection>

      <LegalSection heading="Check the output">
        <p>
          HireLens works from the experience you supply and does not invent
          employers, dates, qualifications or achievements. It is still an AI
          tool and it can be wrong. Read anything it writes before you send it
          to an employer. What you submit is your responsibility.
        </p>
      </LegalSection>

      <LegalSection heading="Fair use">
        <p>
          AI analysis is limited per day so the service stays available to
          everyone. Do not attempt to bypass those limits, access another
          user&apos;s data, or disrupt the service.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          These terms may change as HireLens changes. The date at the top shows
          the current version. Questions go through{" "}
          <Link href="/dashboard/help" className="text-text-primary underline underline-offset-4">
            Help
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

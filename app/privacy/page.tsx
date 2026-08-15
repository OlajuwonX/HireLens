import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalLayout,
  LegalSection,
} from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What HireLens stores, why it stores it, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy" updated="August 2026">
      <LegalSection heading="What HireLens stores">
        <p>
          Your name and email address, taken from Google when you sign in with
          Google or from the form when you create an account with a password.
          Passwords are stored only as a hash and are never readable.
        </p>
        <p>
          The resumes you upload, the job postings you save, the analyses
          HireLens produces from them, and any documents you choose to save to
          your library.
        </p>
      </LegalSection>

      <LegalSection heading="Where files live">
        <p>
          Resume and document files are stored in a private bucket. They are
          not publicly addressable, and every request for one is checked
          against your account before the file is served.
        </p>
      </LegalSection>

      <LegalSection heading="AI processing">
        <p>
          When you save and analyze a job, your resume text and the job posting
          are sent to Google Gemini to produce one analysis. That analysis is
          stored on your account and reused. Opening a cover letter or an
          improved resume afterwards reads the stored result rather than
          sending your data again.
        </p>
      </LegalSection>

      <LegalSection heading="Errors and analytics">
        <p>
          HireLens reports application errors to Sentry so problems can be
          found and fixed. Resume text, document content, job postings and
          request bodies are removed before an error leaves the server.
        </p>
        <p>
          If site analytics are enabled, Google Analytics records anonymized
          page views with the IP address truncated. It is not used inside your
          dashboard and never receives your documents.
        </p>
      </LegalSection>

      <LegalSection heading="What is never done">
        <p>
          Your resumes, analyses and documents are not sold, not shared with
          other users, and not used to train any model.
        </p>
      </LegalSection>

      <LegalSection heading="Deleting your data">
        <p>
          Deleting a resume deletes its stored file. Deleting a document
          removes it from your library and deletes the generated file. Deleting
          your account removes your data from HireLens.
        </p>
        <p>
          If something is not working the way this page describes, tell us
          through <Link href="/dashboard/help" className="text-text-primary underline underline-offset-4">Help</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

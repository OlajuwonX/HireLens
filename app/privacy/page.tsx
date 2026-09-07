import { LegalLayout, LegalSection } from "@/components/marketing/legal-layout";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What HireLens collects, why it collects it, who it is shared with, how long it is kept, how it is protected, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

const linkClass = "text-text-primary underline underline-offset-4";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy" updated="September 2026">
      <LegalSection heading="In short">
        <p>
          HireLens holds your resumes, the jobs you save and the analyses it
          produces from them. It uses that data to run the product for you and
          for nothing else. It is never sold, never shared with other users, and
          never used to train anyone else&rsquo;s model.
        </p>
        <p>
          You can delete your account yourself at any time, for any reason or
          none, from Settings. We do not keep your data against your wishes.
        </p>
        <p>
          HireLens is operated from Nigeria and is written to meet the Nigeria
          Data Protection Act 2023 and the General Application and
          Implementation Directive 2025 issued by the Nigeria Data Protection
          Commission. The same rights described below are offered to every user,
          wherever you are.
        </p>
      </LegalSection>

      <LegalSection heading="Who is responsible for your data">
        <p>
          HireLens is the data controller for the personal data described on
          this page. It decides what is collected and why.
        </p>
        <p>
          To ask a question about privacy, request a copy of your data, correct
          something, or have your account deleted, use{" "}
          <Link href="/dashboard/help" className={linkClass}>
            Help
          </Link>{" "}
          inside the app. We answer privacy requests within 30 days.
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <p>Only what the product needs to work. Specifically:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account details</strong> &mdash; your name and email
            address, and your profile picture if you sign in with Google. If you
            create a password, it is stored only as a bcrypt hash and is never
            readable by us or by anyone else.
          </li>
          <li>
            <strong>Resumes</strong> &mdash; the files you upload, the text
            extracted from them, and each version you keep.
          </li>
          <li>
            <strong>Jobs and applications</strong> &mdash; the job title,
            company, location, salary range, description, requirements, source
            link and any notes you add, plus the status and dates of each
            application and its activity history.
          </li>
          <li>
            <strong>AI output</strong> &mdash; the analyses, match scores, cover
            letters, improved resumes and other documents generated for you, and
            any edits you make to them.
          </li>
          <li>
            <strong>Preferences</strong> &mdash; your timezone, reduced-motion
            setting and default resume.
          </li>
          <li>
            <strong>Product usage counters</strong> &mdash; a record of each AI
            request, used to enforce daily limits and prevent abuse. It records
            that a request happened, not what was in it.
          </li>
          <li>
            <strong>Support reports</strong> &mdash; if you report a problem,
            the category, title, description and the page you were on.
          </li>
          <li>
            <strong>Technical records</strong> &mdash; sign-in timestamps and
            error reports. Error reports are stripped of resume text, document
            content, job descriptions, request bodies and credentials before
            they leave our servers.
          </li>
        </ul>
        <p>
          We do not ask for your date of birth, address, phone number,
          government identification, or payment details, and you should not put
          them in a resume field. We do not knowingly collect data from anyone
          under 18.
        </p>
      </LegalSection>

      <LegalSection heading="Why we collect it, and on what basis">
        <p>
          The Nigeria Data Protection Act requires a lawful basis for every use
          of personal data. Ours are:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>To provide the service you asked for</strong> &mdash;
            storing your resumes, running analyses, generating documents and
            tracking applications. Basis: performance of our agreement with you.
          </li>
          <li>
            <strong>To keep accounts secure</strong> &mdash; authentication,
            email verification, password reset, and detecting abuse. Basis: our
            legitimate interest in a safe service, and our legal obligation to
            protect your data.
          </li>
          <li>
            <strong>To keep the product working</strong> &mdash; error
            monitoring and enforcing usage limits so one account cannot exhaust
            capacity for everyone. Basis: legitimate interest.
          </li>
          <li>
            <strong>Anonymous traffic measurement</strong>, where enabled.
            Basis: consent, which you can withdraw.
          </li>
        </ul>
        <p>
          We do not use your resumes or applications for advertising, profiling
          for marketing, or any purpose beyond the ones listed here.
        </p>
      </LegalSection>

      <LegalSection heading="How AI processing works">
        <p>
          When you analyse a job, the text of your resume and that job posting
          are sent to an AI provider to produce one analysis. The result is
          stored on your account and reused, so opening a cover letter or an
          improved resume afterwards reads the stored result rather than sending
          your data again.
        </p>
        <p>
          We send the minimum needed for the task, we instruct our providers not
          to retain the request for training, and we do not send your name,
          email address or account identifiers along with it.
        </p>
        <p>
          The analysis is advisory. A score or recommendation is information for
          you to act on. No decision with a legal or similarly significant
          effect is made about you automatically, and nothing HireLens produces
          is shared with an employer unless you send it yourself.
        </p>
      </LegalSection>

      <LegalSection heading="Who else processes your data">
        <p>
          HireLens uses a small number of service providers. They may only act
          on our instructions, and none of them may use your data for their own
          purposes.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Google</strong> &mdash; sign-in, and the Gemini model used
            for analysis.
          </li>
          <li>
            <strong>OpenRouter</strong> &mdash; a fallback route to AI models
            when the primary provider is unavailable.
          </li>
          <li>
            <strong>Backblaze B2</strong> &mdash; storage for resume and
            document files.
          </li>
          <li>
            <strong>Neon</strong> &mdash; the database holding everything else.
          </li>
          <li>
            <strong>Vercel</strong> &mdash; hosting and delivery.
          </li>
          <li>
            <strong>Brevo</strong> &mdash; verification, password reset and
            account notification emails.
          </li>
          <li>
            <strong>Sentry</strong> &mdash; error monitoring, receiving scrubbed
            reports only.
          </li>
          <li>
            <strong>Google Analytics</strong> &mdash; anonymised page views with
            the IP address truncated, where enabled. It never receives your
            documents and is not used inside your dashboard.
          </li>
        </ul>
        <p>
          We do not sell your personal data, we do not share it with other
          users, and we do not disclose it to anyone else except where the law
          requires it.
        </p>
      </LegalSection>

      <LegalSection heading="Where your data is processed">
        <p>
          HireLens is operated from Nigeria, but the providers above run
          infrastructure outside Nigeria, mainly in the United States and the
          European Union. Using HireLens therefore involves transferring your
          personal data across borders.
        </p>
        <p>
          We only use providers that commit contractually to protecting personal
          data to a standard comparable with the Nigeria Data Protection Act,
          and we rely on those contractual terms as the basis for the transfer.
          If you would rather your data were not processed outside Nigeria,
          HireLens is not able to offer that today, and you should not upload
          your resume.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>While your account is open</strong> &mdash; your resumes,
            jobs, applications, analyses and documents stay until you delete
            them or close your account. We do not expire them on a timer,
            because a job search runs for months and losing your history would
            not serve you.
          </li>
          <li>
            <strong>When you delete an item</strong> &mdash; deleting a resume
            deletes its stored file. Deleting a document removes it from your
            library and deletes the generated file.
          </li>
          <li>
            <strong>When you close your account</strong> &mdash; everything tied
            to it is held for 30 days so you can change your mind, then
            permanently deleted, including the files held in storage.
          </li>
          <li>
            <strong>Backups</strong> &mdash; our database provider keeps
            encrypted point-in-time backups for a short window for disaster
            recovery. Deleted data can persist in those backups until they age
            out, and is not restored to the live service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How your data is protected">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Everything travels over an encrypted connection, and stored files
            and database contents are encrypted at rest by our providers.
          </li>
          <li>
            Passwords are stored only as bcrypt hashes. Session and verification
            tokens are stored hashed, never in readable form.
          </li>
          <li>
            Resume and document files live in a private bucket. They are not
            publicly addressable, every request is checked against your account
            first, and files are served through short-lived links that expire.
          </li>
          <li>
            Every database query is scoped to the signed-in account, so one user
            cannot reach another user&rsquo;s data even by guessing an
            identifier.
          </li>
          <li>
            Error reports are scrubbed of resume text, document content, job
            descriptions, email content, tokens and credentials before leaving
            the server.
          </li>
          <li>
            Access to production systems is limited to those who need it to run
            the service.
          </li>
        </ul>
        <p>
          If a breach occurs that is likely to put your rights at risk, we will
          notify the Nigeria Data Protection Commission within 72 hours of
          becoming aware of it, and tell affected users directly.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>Under the Nigeria Data Protection Act 2023 you have the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>be told what we hold about you and why</li>
          <li>
            get a copy of your personal data in a portable electronic format
          </li>
          <li>correct anything inaccurate</li>
          <li>have your personal data deleted</li>
          <li>object to or restrict a particular use</li>
          <li>withdraw consent at any time, where we relied on consent</li>
          <li>
            complain to the Nigeria Data Protection Commission at{" "}
            <a
              href="https://ndpc.gov.ng"
              className={linkClass}
              target="_blank"
              rel="noreferrer"
            >
              ndpc.gov.ng
            </a>
          </li>
        </ul>
        <p>
          Exercising any of these is free, and we will not degrade your service
          for asking. Ask through{" "}
          <Link href="/dashboard/help" className={linkClass}>
            Help
          </Link>
          . We respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection heading="Deleting your account">
        <p>
          You can have your HireLens account deleted at any time, for any reason
          or for no reason. If the product is not useful to you, we would rather
          you left cleanly than stayed unhappy. We do not hold your data against
          your wishes and we will not make you argue for it.
        </p>
        <p>
          Open <strong>Settings &rarr; Account</strong> and choose{" "}
          <strong>Delete my account</strong>. Access stops immediately. Your
          resumes, uploaded files, saved jobs, applications, analyses, documents
          and notifications are then held for 30 days and permanently deleted on
          the date shown to you, along with the files in our storage provider.
          After that date nothing can be recovered.
        </p>
        <p>
          You can change your mind at any point during those 30 days by signing
          in and choosing Restore. We email you when deletion is scheduled, once
          more shortly before the deadline, and again if the account is
          restored.
        </p>
        <p>
          If you only want a break, <strong>Pause your account</strong> in the
          same place stops access without deleting anything and starts no timer.
        </p>
        <p>
          Deleting your account does not require you to give a reason, and you
          are free to create a new account with the same email address once the
          deletion is complete.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies and local storage">
        <p>
          HireLens sets a session cookie so you stay signed in. That cookie is
          strictly necessary and cannot be turned off while you are using the
          product.
        </p>
        <p>
          Your browser also stores small interface preferences, such as whether
          the sidebar is collapsed and your theme. These never leave your
          device.
        </p>
        <p>
          Where site analytics are enabled, they record anonymised page views
          with the IP address truncated. They do not follow you across other
          websites.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          If what we collect or how we use it changes materially, we will update
          this page and change the date at the top, and tell you in the product
          before the change takes effect where it affects you directly.
        </p>
        <p>
          If something is not working the way this page describes, tell us
          through{" "}
          <Link href="/dashboard/help" className={linkClass}>
            Help
          </Link>
          . A privacy policy that does not match the product is a bug, and we
          will treat it as one.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

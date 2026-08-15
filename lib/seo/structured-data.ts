import "server-only";

import {
  AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  getSiteUrl,
} from "./site";

export const FAQ = [
  {
    question: "Does HireLens write my resume for me?",
    answer:
      "No. HireLens works from the experience you already have. It rewrites how that experience is presented and shows what a job posting is asking for that your resume does not yet evidence. It never invents employers, dates, metrics or qualifications.",
  },
  {
    question: "How does the job fit score work?",
    answer:
      "When you save a job, HireLens compares your resume against the posting and returns one analysis covering ATS compatibility, required skills, experience alignment and preferred skills. Every document you open afterwards is read from that single analysis.",
  },
  {
    question: "Is HireLens free?",
    answer:
      "Yes. HireLens is free to use with a daily limit on AI analysis, which keeps the service available for everyone.",
  },
  {
    question: "What happens to my resume?",
    answer:
      "Your resume is stored in a private bucket and is only ever readable by your account. It is used to produce your analysis and nothing else. Deleting a resume deletes the stored file.",
  },
] as const;

export function buildStructuredData() {
  const siteUrl = getSiteUrl();

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: SITE_NAME,
      url: siteUrl,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#author` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${siteUrl}/#author`,
      name: AUTHOR.name,
      url: AUTHOR.url,
      sameAs: [AUTHOR.github, AUTHOR.linkedin, AUTHOR.x],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#app`,
      name: SITE_NAME,
      url: siteUrl,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      image: absoluteUrl("/opengraph-image"),
      author: { "@id": `${siteUrl}/#author` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Resume analysis against real job requirements",
        "Job fit and ATS compatibility scoring",
        "Tailored cover letters and follow-up messages",
        "Resume versions and application tracking",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}

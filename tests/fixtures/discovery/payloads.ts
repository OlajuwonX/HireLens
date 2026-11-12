export const greenhousePayload = {
  jobs: [
    {
      id: 101,
      title: "Senior Frontend Engineer",
      company_name: "Acme",
      absolute_url: "https://boards.greenhouse.io/acme/jobs/101",
      location: { name: "Remote - Europe" },
      first_published: "2026-10-01T09:00:00-04:00",
      updated_at: "2026-10-20T09:00:00-04:00",
      content:
        "&lt;h2&gt;About the role&lt;/h2&gt;&lt;p&gt;Build React &amp;amp; TypeScript apps. Full-time.&lt;/p&gt;&lt;p&gt;Salary: $120,000 - $150,000&lt;/p&gt;",
    },
    {
      id: 102,
      title: "Designer",
      company_name: "Acme",
      absolute_url: "javascript:alert(1)",
      location: { name: "London" },
      content: "",
    },
    { id: 103, title: "", absolute_url: "https://boards.greenhouse.io/acme/jobs/103" },
  ],
  meta: { total: 3 },
};

export const leverPayload = [
  {
    id: "4f1c2b8e-0000-4000-8000-000000000001",
    text: "Frontend Developer",
    categories: { commitment: "Full-time", location: "Lagos", team: "Web" },
    createdAt: 1790000000000,
    hostedUrl: "https://jobs.lever.co/globex/4f1c2b8e-0000-4000-8000-000000000001",
    applyUrl: "https://jobs.lever.co/globex/4f1c2b8e-0000-4000-8000-000000000001/apply",
    workplaceType: "hybrid",
    descriptionPlain: "Join the web team.",
    lists: [{ text: "Requirements", content: "<li>React</li><li>Next.js</li>" }],
    additionalPlain: "We value curiosity.",
    salaryRange: { min: 30000, max: 45000, currency: "USD", interval: "per-year-salary" },
  },
];

export const ashbyPayload = {
  apiVersion: "1",
  jobs: [
    {
      id: "a1",
      title: "React Native Engineer",
      employmentType: "Contract",
      location: "Remote",
      isListed: true,
      isRemote: true,
      workplaceType: "Remote",
      publishedAt: "2026-09-15T10:00:00.000+00:00",
      jobUrl: "https://jobs.ashbyhq.com/initech/a1",
      applyUrl: "https://jobs.ashbyhq.com/initech/a1/application",
      descriptionPlain: "Ship mobile features.",
      descriptionHtml: "<p>Ship mobile features.</p>",
      compensation: { compensationTierSummary: "€60K – €80K" },
    },
    {
      id: "a2",
      title: "Hidden Role",
      isListed: false,
      jobUrl: "https://jobs.ashbyhq.com/initech/a2",
    },
  ],
};

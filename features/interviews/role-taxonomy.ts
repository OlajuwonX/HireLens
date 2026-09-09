export type RoleDomain =
  | "software"
  | "data"
  | "product-design"
  | "business"
  | "healthcare"
  | "legal"
  | "finance"
  | "built-environment"
  | "education";

export type RoleFamily = {
  slug: string;
  domain: RoleDomain;
  titlePhrases: string[];
  titleTokens: string[];
  skillSignals: string[];
  topics: string[];
};

const ABBREVIATIONS: Record<string, string> = {
  sr: "senior",
  snr: "senior",
  jr: "junior",
  jnr: "junior",
  dev: "developer",
  devs: "developer",
  eng: "engineer",
  engg: "engineer",
  engr: "engineer",
  mgr: "manager",
  admin: "administrator",
  arch: "architect",
  ops: "operations",
  qa: "quality assurance",
  sdet: "quality assurance engineer",
  ux: "user experience",
  ui: "user interface",
  pm: "product manager",
  ml: "machine learning",
  ai: "artificial intelligence",
  hr: "human resources",
  sre: "site reliability engineer",
};

const SKILL_ALIASES: Record<string, string> = {
  "react js": "react",
  reactjs: "react",
  "react native": "react native",
  "node js": "nodejs",
  node: "nodejs",
  "next js": "nextjs",
  nextjs: "nextjs",
  "vue js": "vue",
  vuejs: "vue",
  js: "javascript",
  ts: "typescript",
  golang: "go",
  "c sharp": "csharp",
  "dot net": "dotnet",
  postgres: "postgresql",
  "postgre sql": "postgresql",
  "postgres sql": "postgresql",
  psql: "postgresql",
  mongo: "mongodb",
  k8s: "kubernetes",
  "amazon web services": "aws",
  "google cloud platform": "gcp",
  "microsoft azure": "azure",
  "gitlab ci": "ci cd",
  "github actions": "ci cd",
  restful: "rest",
  "rest api": "rest",
  "rest apis": "rest",
  "graph ql": "graphql",
  tailwindcss: "tailwind",
  "tailwind css": "tailwind",
};

const STRONG_DOMAIN_MARKERS: Record<RoleDomain, string[]> = {
  healthcare: [
    "nurse",
    "nursing",
    "physician",
    "doctor",
    "clinician",
    "clinical",
    "medical",
    "pharmacist",
    "radiographer",
    "phlebotomist",
    "midwife",
    "paramedic",
    "physiotherapist",
    "occupational therapist",
    "dentist",
    "surgeon",
  ],
  legal: [
    "lawyer",
    "attorney",
    "solicitor",
    "barrister",
    "paralegal",
    "legal counsel",
    "counsel",
    "legal secretary",
    "conveyancer",
    "compliance officer",
  ],
  finance: [
    "accountant",
    "accounting",
    "auditor",
    "audit",
    "bookkeeper",
    "financial analyst",
    "finance analyst",
    "actuary",
    "tax advisor",
    "credit analyst",
    "treasury analyst",
    "financial controller",
  ],
  "built-environment": [
    "quantity surveyor",
    "surveyor",
    "estimator",
    "site manager",
    "civil engineer",
    "structural engineer",
    "building surveyor",
    "architect",
    "town planner",
    "clerk of works",
    "cost consultant",
    "project quantity surveyor",
  ],
  education: [
    "teacher",
    "lecturer",
    "professor",
    "tutor",
    "instructor",
    "teaching assistant",
    "headteacher",
    "principal teacher",
    "curriculum",
  ],
  software: [],
  data: [],
  "product-design": [],
  business: [],
};

export const ROLE_FAMILIES: RoleFamily[] = [
  {
    slug: "frontend-engineering",
    domain: "software",
    titlePhrases: [
      "frontend engineer",
      "front end engineer",
      "frontend developer",
      "front end developer",
      "react developer",
      "react engineer",
      "ui engineer",
      "ui developer",
      "web developer",
      "javascript developer",
      "client side engineer",
    ],
    titleTokens: ["frontend", "front"],
    skillSignals: [
      "react",
      "nextjs",
      "vue",
      "angular",
      "svelte",
      "typescript",
      "javascript",
      "css",
      "tailwind",
      "redux",
      "webpack",
      "vite",
      "accessibility",
      "html",
    ],
    topics: [
      "component architecture",
      "state management",
      "browser rendering and performance",
      "accessibility",
      "frontend testing",
      "css layout and design systems",
    ],
  },
  {
    slug: "backend-engineering",
    domain: "software",
    titlePhrases: [
      "backend engineer",
      "back end engineer",
      "backend developer",
      "back end developer",
      "api engineer",
      "server side engineer",
      "golang engineer",
      "java developer",
      "python developer",
      "ruby developer",
    ],
    titleTokens: ["backend", "back"],
    skillSignals: [
      "nodejs",
      "go",
      "java",
      "python",
      "ruby",
      "rails",
      "spring",
      "django",
      "postgresql",
      "mysql",
      "redis",
      "rest",
      "graphql",
      "grpc",
      "kafka",
      "microservices",
    ],
    topics: [
      "api design",
      "data modelling and databases",
      "concurrency and reliability",
      "caching and performance",
      "authentication and authorization",
      "system design",
    ],
  },
  {
    slug: "fullstack-engineering",
    domain: "software",
    titlePhrases: [
      "full stack engineer",
      "fullstack engineer",
      "full stack developer",
      "fullstack developer",
    ],
    titleTokens: ["fullstack", "stack"],
    skillSignals: [
      "react",
      "nextjs",
      "nodejs",
      "typescript",
      "javascript",
      "postgresql",
      "rest",
      "graphql",
      "docker",
      "aws",
    ],
    topics: [
      "end to end feature delivery",
      "api and data modelling",
      "frontend architecture",
      "testing across the stack",
      "deployment and observability",
      "system design",
    ],
  },
  {
    slug: "mobile-engineering",
    domain: "software",
    titlePhrases: [
      "mobile engineer",
      "mobile developer",
      "ios engineer",
      "ios developer",
      "android engineer",
      "android developer",
      "react native developer",
      "flutter developer",
    ],
    titleTokens: ["mobile", "ios", "android"],
    skillSignals: [
      "swift",
      "kotlin",
      "objective c",
      "react native",
      "flutter",
      "dart",
      "android",
      "ios",
      "xcode",
      "jetpack compose",
    ],
    topics: [
      "mobile app architecture",
      "offline and state persistence",
      "performance and battery",
      "platform APIs and permissions",
      "release and store processes",
      "mobile testing",
    ],
  },
  {
    slug: "devops-sre",
    domain: "software",
    titlePhrases: [
      "devops engineer",
      "site reliability engineer",
      "platform engineer",
      "infrastructure engineer",
      "cloud engineer",
      "build engineer",
    ],
    titleTokens: ["devops", "sre", "infrastructure", "platform"],
    skillSignals: [
      "kubernetes",
      "docker",
      "terraform",
      "ansible",
      "aws",
      "gcp",
      "azure",
      "ci cd",
      "prometheus",
      "grafana",
      "linux",
      "helm",
    ],
    topics: [
      "infrastructure as code",
      "container orchestration",
      "observability and alerting",
      "incident response and reliability",
      "ci cd pipelines",
      "cloud networking and security",
    ],
  },
  {
    slug: "data-engineering",
    domain: "data",
    titlePhrases: [
      "data engineer",
      "analytics engineer",
      "etl developer",
      "big data engineer",
      "data platform engineer",
    ],
    titleTokens: ["data engineer", "etl"],
    skillSignals: [
      "spark",
      "airflow",
      "dbt",
      "kafka",
      "snowflake",
      "bigquery",
      "redshift",
      "sql",
      "python",
      "hadoop",
      "data warehouse",
    ],
    topics: [
      "batch and streaming pipelines",
      "data warehouse modelling",
      "orchestration and scheduling",
      "data quality and lineage",
      "cost and performance tuning",
      "sql and distributed processing",
    ],
  },
  {
    slug: "data-science-ml",
    domain: "data",
    titlePhrases: [
      "data scientist",
      "machine learning engineer",
      "ml engineer",
      "applied scientist",
      "research scientist",
      "ai engineer",
    ],
    titleTokens: ["scientist", "machine learning"],
    skillSignals: [
      "python",
      "pandas",
      "numpy",
      "scikit learn",
      "tensorflow",
      "pytorch",
      "machine learning",
      "statistics",
      "nlp",
      "mlops",
      "sql",
    ],
    topics: [
      "model selection and evaluation",
      "feature engineering",
      "experiment design and statistics",
      "handling imbalanced and messy data",
      "productionising models",
      "bias and validation",
    ],
  },
  {
    slug: "data-analytics",
    domain: "data",
    titlePhrases: [
      "data analyst",
      "business intelligence analyst",
      "bi analyst",
      "reporting analyst",
      "insights analyst",
      "analytics analyst",
    ],
    titleTokens: ["analyst"],
    skillSignals: [
      "sql",
      "excel",
      "power bi",
      "tableau",
      "looker",
      "dbt",
      "python",
      "statistics",
      "dashboards",
    ],
    topics: [
      "sql querying and joins",
      "metric definition",
      "dashboard and report design",
      "experiment and cohort analysis",
      "data cleaning",
      "communicating insights",
    ],
  },
  {
    slug: "qa-engineering",
    domain: "software",
    titlePhrases: [
      "qa engineer",
      "quality assurance engineer",
      "test engineer",
      "automation engineer",
      "sdet",
      "quality engineer",
    ],
    titleTokens: ["qa", "quality", "test"],
    skillSignals: [
      "selenium",
      "cypress",
      "playwright",
      "appium",
      "junit",
      "pytest",
      "test automation",
      "postman",
      "jmeter",
    ],
    topics: [
      "test strategy and coverage",
      "test automation frameworks",
      "api and integration testing",
      "performance and load testing",
      "bug triage and reporting",
      "ci integration of tests",
    ],
  },
  {
    slug: "security-engineering",
    domain: "software",
    titlePhrases: [
      "security engineer",
      "application security engineer",
      "penetration tester",
      "security analyst",
      "information security engineer",
    ],
    titleTokens: ["security", "appsec"],
    skillSignals: [
      "owasp",
      "penetration testing",
      "burp suite",
      "siem",
      "threat modelling",
      "cryptography",
      "iam",
      "vulnerability management",
    ],
    topics: [
      "common vulnerability classes",
      "threat modelling",
      "authentication and authorization",
      "secure sdlc",
      "detection and incident response",
      "cryptography basics",
    ],
  },
  {
    slug: "engineering-management",
    domain: "software",
    titlePhrases: [
      "engineering manager",
      "software development manager",
      "team lead",
      "tech lead manager",
      "head of engineering",
      "director of engineering",
    ],
    titleTokens: [],
    skillSignals: [
      "people management",
      "hiring",
      "roadmap",
      "delivery",
      "agile",
      "stakeholder management",
    ],
    topics: [
      "team health and one to ones",
      "delivery and estimation",
      "hiring and performance management",
      "technical strategy",
      "cross team collaboration",
      "incident and risk handling",
    ],
  },
  {
    slug: "product-management",
    domain: "product-design",
    titlePhrases: [
      "product manager",
      "product owner",
      "technical product manager",
      "group product manager",
      "head of product",
    ],
    titleTokens: ["product"],
    skillSignals: [
      "roadmap",
      "user research",
      "analytics",
      "a b testing",
      "prioritization",
      "stakeholder management",
      "sql",
    ],
    topics: [
      "discovery and problem framing",
      "prioritisation frameworks",
      "metrics and success measures",
      "stakeholder alignment",
      "roadmapping and trade offs",
      "working with engineering and design",
    ],
  },
  {
    slug: "product-design",
    domain: "product-design",
    titlePhrases: [
      "product designer",
      "ux designer",
      "ui designer",
      "user experience designer",
      "interaction designer",
      "ux ui designer",
    ],
    titleTokens: ["designer"],
    skillSignals: [
      "figma",
      "sketch",
      "prototyping",
      "design systems",
      "user research",
      "wireframing",
      "accessibility",
      "interaction design",
    ],
    topics: [
      "design process and critique",
      "user research and testing",
      "information architecture",
      "design systems and consistency",
      "accessibility",
      "collaboration with product and engineering",
    ],
  },
  {
    slug: "project-delivery-management",
    domain: "business",
    titlePhrases: [
      "project manager",
      "programme manager",
      "program manager",
      "delivery manager",
      "scrum master",
      "project coordinator",
    ],
    titleTokens: [],
    skillSignals: [
      "agile",
      "scrum",
      "kanban",
      "risk management",
      "stakeholder management",
      "budgeting",
      "gantt",
      "jira",
    ],
    topics: [
      "planning and estimation",
      "risk and dependency management",
      "stakeholder communication",
      "agile ceremonies and delivery",
      "budget and scope control",
      "reporting and governance",
    ],
  },
  {
    slug: "digital-marketing",
    domain: "business",
    titlePhrases: [
      "marketing manager",
      "digital marketing manager",
      "growth marketer",
      "seo specialist",
      "content marketer",
      "performance marketing manager",
    ],
    titleTokens: ["marketing"],
    skillSignals: [
      "seo",
      "sem",
      "google analytics",
      "google ads",
      "content strategy",
      "email marketing",
      "hubspot",
      "a b testing",
      "social media",
    ],
    topics: [
      "channel strategy and mix",
      "campaign measurement and attribution",
      "seo and content",
      "paid acquisition and budgets",
      "conversion optimisation",
      "positioning and messaging",
    ],
  },
  {
    slug: "sales-account-management",
    domain: "business",
    titlePhrases: [
      "account executive",
      "sales representative",
      "sales manager",
      "business development manager",
      "account manager",
      "sales development representative",
    ],
    titleTokens: ["sales"],
    skillSignals: [
      "crm",
      "salesforce",
      "pipeline management",
      "prospecting",
      "negotiation",
      "forecasting",
      "quota",
    ],
    topics: [
      "discovery and qualification",
      "pipeline and forecasting",
      "objection handling and negotiation",
      "account planning",
      "crm hygiene and process",
      "closing and expansion",
    ],
  },
  {
    slug: "accounting-audit",
    domain: "finance",
    titlePhrases: [
      "accountant",
      "management accountant",
      "financial accountant",
      "auditor",
      "audit associate",
      "finance manager",
    ],
    titleTokens: ["accountant", "audit"],
    skillSignals: [
      "ifrs",
      "gaap",
      "reconciliations",
      "month end close",
      "financial reporting",
      "tax",
      "excel",
      "sap",
      "audit",
    ],
    topics: [
      "financial statements and standards",
      "month end close and reconciliations",
      "internal controls and audit",
      "tax and compliance basics",
      "variance and management reporting",
      "accounting systems",
    ],
  },
  {
    slug: "quantity-surveying",
    domain: "built-environment",
    titlePhrases: [
      "quantity surveyor",
      "cost consultant",
      "commercial manager",
      "estimator",
      "project quantity surveyor",
    ],
    titleTokens: ["surveyor", "estimator"],
    skillSignals: [
      "cost planning",
      "procurement",
      "contract administration",
      "jct",
      "nec",
      "valuations",
      "final account",
      "measurement",
      "tendering",
    ],
    topics: [
      "cost planning and estimating",
      "measurement and valuations",
      "forms of contract and administration",
      "procurement routes",
      "change and final accounts",
      "risk and value management",
    ],
  },
  {
    slug: "civil-structural-engineering",
    domain: "built-environment",
    titlePhrases: [
      "civil engineer",
      "structural engineer",
      "geotechnical engineer",
      "site engineer",
      "design engineer civil",
    ],
    titleTokens: [],
    skillSignals: [
      "autocad",
      "revit",
      "structural analysis",
      "eurocodes",
      "reinforced concrete",
      "steel design",
      "geotechnical",
      "drainage",
    ],
    topics: [
      "structural analysis and load paths",
      "design codes and standards",
      "materials and detailing",
      "site constraints and constructability",
      "drawings and coordination",
      "health and safety in design",
    ],
  },
  {
    slug: "nursing",
    domain: "healthcare",
    titlePhrases: [
      "registered nurse",
      "staff nurse",
      "nurse practitioner",
      "charge nurse",
      "clinical nurse",
    ],
    titleTokens: ["nurse", "nursing"],
    skillSignals: [
      "patient care",
      "medication administration",
      "care planning",
      "triage",
      "infection control",
      "observations",
      "safeguarding",
    ],
    topics: [
      "assessment and observations",
      "medication safety",
      "care planning and documentation",
      "infection prevention and control",
      "escalation and deterioration",
      "safeguarding and consent",
    ],
  },
  {
    slug: "clinical-practice",
    domain: "healthcare",
    titlePhrases: [
      "physician",
      "general practitioner",
      "medical officer",
      "clinical fellow",
      "consultant physician",
    ],
    titleTokens: ["physician", "clinician"],
    skillSignals: [
      "diagnosis",
      "clinical assessment",
      "prescribing",
      "differential diagnosis",
      "patient management",
    ],
    topics: [
      "history taking and examination",
      "differential diagnosis",
      "investigations and interpretation",
      "management planning",
      "safe prescribing",
      "ethics and consent",
    ],
  },
  {
    slug: "legal-practice",
    domain: "legal",
    titlePhrases: [
      "solicitor",
      "attorney",
      "associate lawyer",
      "paralegal",
      "legal counsel",
      "in house counsel",
    ],
    titleTokens: ["lawyer", "attorney", "solicitor", "paralegal"],
    skillSignals: [
      "legal research",
      "drafting",
      "contract review",
      "due diligence",
      "litigation",
      "case management",
      "compliance",
    ],
    topics: [
      "legal research and analysis",
      "drafting and review",
      "matter and case management",
      "risk and compliance",
      "negotiation",
      "professional conduct",
    ],
  },
  {
    slug: "teaching-education",
    domain: "education",
    titlePhrases: [
      "teacher",
      "lecturer",
      "tutor",
      "instructor",
      "teaching assistant",
    ],
    titleTokens: ["teacher", "lecturer", "tutor"],
    skillSignals: [
      "lesson planning",
      "curriculum",
      "assessment",
      "classroom management",
      "differentiation",
      "safeguarding",
    ],
    topics: [
      "lesson planning and objectives",
      "assessment and feedback",
      "classroom management",
      "differentiation and inclusion",
      "curriculum knowledge",
      "safeguarding",
    ],
  },
];

const GENERIC_SOFTWARE_TITLES = [
  "software engineer",
  "software developer",
  "software development engineer",
  "application developer",
  "applications developer",
  "programmer",
  "coder",
  "developer",
];

const SOFTWARE_DOMAINS: RoleDomain[] = ["software", "data"];

const SPECIALISED_SOFTWARE_FAMILIES = new Set([
  "frontend-engineering",
  "backend-engineering",
  "mobile-engineering",
  "devops-sre",
  "data-engineering",
  "data-science-ml",
  "data-analytics",
  "qa-engineering",
  "security-engineering",
]);

const ROLE_MATCH_THRESHOLD = 5;

const GENERIC_TITLE_WORDS = new Set([
  "senior",
  "junior",
  "lead",
  "principal",
  "staff",
  "entry",
  "level",
  "intern",
  "trainee",
  "graduate",
  "the",
  "of",
  "and",
  "a",
  "an",
  "ii",
  "iii",
  "iv",
  "i",
]);

export function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTitle(title: string) {
  return normalizeText(title)
    .split(" ")
    .filter(Boolean)
    .map((token) => ABBREVIATIONS[token] ?? token)
    .join(" ");
}

export function normalizeSkill(skill: string) {
  const cleaned = normalizeText(skill);

  if (SKILL_ALIASES[cleaned]) {
    return SKILL_ALIASES[cleaned];
  }

  return cleaned;
}

export function detectDomain(normalizedTitle: string): RoleDomain | null {
  for (const [domain, markers] of Object.entries(STRONG_DOMAIN_MARKERS) as [
    RoleDomain,
    string[],
  ][]) {
    if (markers.length === 0) {
      continue;
    }

    if (markers.some((marker) => normalizedTitle.includes(marker))) {
      return domain;
    }
  }

  return null;
}

export type RoleResolution = {
  roleFamily: string;
  domain: RoleDomain | null;
  matchedBy: "title" | "skills" | "fallback";
  topics: string[];
};

function fallbackSlug(normalizedTitle: string) {
  const words = normalizedTitle
    .split(" ")
    .filter((word) => word && !GENERIC_TITLE_WORDS.has(word));

  const slug = (words.length > 0 ? words : normalizedTitle.split(" "))
    .join("-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `general-${slug || "role"}`;
}

type FamilyScore = {
  family: RoleFamily;
  score: number;
  titleScore: number;
  skillScore: number;
};

function scoreFamilies(input: {
  normalizedTitle: string;
  normalizedHeadline: string;
  skillSet: ReadonlySet<string>;
  jobText: string;
  candidates: RoleFamily[];
  genericSoftware: boolean;
}): FamilyScore[] {
  return input.candidates.map((family) => {
    let titleScore = 0;
    let skillScore = 0;

    for (const phrase of family.titlePhrases) {
      if (input.normalizedTitle.includes(phrase)) {
        titleScore += 10;
      } else if (input.normalizedHeadline.includes(phrase)) {
        titleScore += 6;
      }
    }

    for (const token of family.titleTokens) {
      if (token && input.normalizedTitle.includes(token)) {
        titleScore += 3;
      }
    }

    if (input.genericSoftware && SOFTWARE_DOMAINS.includes(family.domain)) {
      titleScore += 2;
    }

    for (const signal of family.skillSignals) {
      if (input.skillSet.has(signal)) {
        skillScore += 1;
      } else if (input.jobText && input.jobText.includes(signal)) {
        skillScore += 0.5;
      }
    }

    const cappedSkill = Math.min(skillScore, 6);

    return {
      family,
      score: titleScore + cappedSkill,
      titleScore,
      skillScore: cappedSkill,
    };
  });
}

function pickBest(scores: FamilyScore[]): FamilyScore | null {
  let best: FamilyScore | null = null;

  for (const entry of scores) {
    if (
      !best ||
      entry.score > best.score ||
      (entry.score === best.score && entry.skillScore > best.skillScore) ||
      (entry.score === best.score &&
        entry.skillScore === best.skillScore &&
        entry.family.slug < best.family.slug)
    ) {
      best = entry;
    }
  }

  return best;
}

export function resolveRoleFamily(input: {
  title: string;
  headline?: string | null;
  skills: string[];
  jobText?: string | null;
}): RoleResolution {
  const normalizedTitle = normalizeTitle(input.title);
  const normalizedHeadline = input.headline
    ? normalizeTitle(input.headline)
    : "";
  const skillSet = new Set(input.skills.map(normalizeSkill).filter(Boolean));
  const jobText = input.jobText ? normalizeText(input.jobText) : "";
  const domain = detectDomain(normalizedTitle || normalizedHeadline);
  const genericSoftware =
    (!domain || SOFTWARE_DOMAINS.includes(domain)) &&
    GENERIC_SOFTWARE_TITLES.some((generic) => normalizedTitle.includes(generic));

  const candidates = ROLE_FAMILIES.filter((family) => {
    if (!domain) {
      return true;
    }

    if (SOFTWARE_DOMAINS.includes(domain)) {
      return SOFTWARE_DOMAINS.includes(family.domain);
    }

    return family.domain === domain;
  });

  const scores = scoreFamilies({
    normalizedTitle,
    normalizedHeadline,
    skillSet,
    jobText,
    candidates,
    genericSoftware,
  });

  let best = pickBest(scores);

  if (best && best.family.slug === "fullstack-engineering") {
    const generalist = best;
    const specialised = pickBest(
      scores.filter(
        (entry) =>
          SPECIALISED_SOFTWARE_FAMILIES.has(entry.family.slug) &&
          entry.skillScore >= 2 &&
          entry.score >= generalist.score - 2,
      ),
    );

    if (specialised) {
      best = specialised;
    }
  }

  if (best && best.score >= ROLE_MATCH_THRESHOLD) {
    return {
      roleFamily: best.family.slug,
      domain: best.family.domain,
      matchedBy: best.titleScore === 0 ? "skills" : "title",
      topics: best.family.topics,
    };
  }

  if (genericSoftware) {
    return {
      roleFamily: "fullstack-engineering",
      domain: "software",
      matchedBy: "fallback",
      topics:
        ROLE_FAMILIES.find((family) => family.slug === "fullstack-engineering")
          ?.topics ?? [],
    };
  }

  return {
    roleFamily: fallbackSlug(normalizedTitle || normalizedHeadline),
    domain,
    matchedBy: "fallback",
    topics: [],
  };
}

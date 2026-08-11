import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

const userOwned = {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
};

export const resumeStatus = pgEnum("resume_status", [
  "UPLOADING",
  "PROCESSING",
  "READY",
  "FAILED",
  "ARCHIVED",
]);

export const fileAssetKind = pgEnum("file_asset_kind", [
  "RESUME_PDF",
  "RESUME_PREVIEW",
  "GENERATED_DOCUMENT",
]);

export const jobStatus = pgEnum("job_status", [
  "SAVED",
  "ARCHIVED",
]);

export const workArrangement = pgEnum("work_arrangement", [
  "REMOTE",
  "HYBRID",
  "ON_SITE",
  "NOT_SPECIFIED",
]);

export const employmentType = pgEnum("employment_type", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
  "FREELANCE",
  "NOT_SPECIFIED",
]);

export const applicationStatus = pgEnum("application_stage", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
]);

export const analysisStatus = pgEnum("analysis_status", [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
]);

export const documentType = pgEnum("document_type", [
  "IMPROVED_RESUME",
  "COVER_LETTER",
  "APPLICATION_EMAIL",
  "PROFESSIONAL_SUMMARY",
  "KEYWORD_ANALYSIS",
  "BULLET_REWRITE",
  "FOLLOW_UP_MESSAGE",
  "EMAIL_SUBJECT",
  "LINKEDIN_MESSAGE",
  "FOLLOW_UP_EMAIL",
  "THANK_YOU_EMAIL",
  "PROFESSIONAL_INTRO",
  "CAREER_CHANGE_EXPLANATION",
  "ENTRY_LEVEL_NOTE",
]);

export const usageAction = pgEnum("usage_action", [
  "APPLICATION_ANALYSIS",
  "APPLICATION_REGENERATE",
  "GENERAL_ANALYSIS",
  "JOB_ANALYSIS",
  "COVER_LETTER",
  "APPLICATION_MESSAGE",
  "IMPROVED_RESUME",
  "PROFESSIONAL_SUMMARY",
  "KEYWORD_ANALYSIS",
  "BULLET_REWRITE",
  "FOLLOW_UP_MESSAGE",
]);

export const usageStatus = pgEnum("usage_status", [
  "RESERVED",
  "COMPLETED",
  "FAILED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    name: text("name"),
    email: text("email").notNull(),
    image: text("image"),
    passwordHash: text("password_hash"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_public_id_idx").on(table.publicId),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("accounts_provider_account_idx").on(
      table.provider,
      table.providerAccountId,
    ),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sessions_token_hash_idx").on(table.sessionTokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("verification_tokens_identifier_token_idx").on(
      table.identifier,
      table.tokenHash,
    ),
  ],
);

export const fileAssets = pgTable(
  "file_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    ...userOwned,
    kind: fileAssetKind("kind").notNull(),
    storageProvider: text("storage_provider").notNull(),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("file_assets_public_id_idx").on(table.publicId),
    uniqueIndex("file_assets_storage_key_idx").on(table.storageKey),
    index("file_assets_user_kind_idx").on(table.userId, table.kind),
  ],
);

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    ...userOwned,
    title: text("title").notNull(),
    status: resumeStatus("status").notNull().default("UPLOADING"),
    defaultVersionId: uuid("default_version_id"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("resumes_public_id_idx").on(table.publicId),
    index("resumes_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    ...userOwned,
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    fileAssetId: uuid("file_asset_id")
      .notNull()
      .references(() => fileAssets.id, { onDelete: "restrict" }),
    previewAssetId: uuid("preview_asset_id").references(() => fileAssets.id, {
      onDelete: "set null",
    }),
    label: text("label").notNull(),
    extractedText: text("extracted_text"),
    versionNumber: integer("version_number").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("resume_versions_public_id_idx").on(table.publicId),
    uniqueIndex("resume_versions_resume_number_idx").on(
      table.resumeId,
      table.versionNumber,
    ),
    index("resume_versions_user_resume_idx").on(table.userId, table.resumeId),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    ...userOwned,
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location"),
    workArrangement: workArrangement("work_arrangement").notNull().default("NOT_SPECIFIED"),
    employmentType: employmentType("employment_type").notNull().default("NOT_SPECIFIED"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    currency: text("currency"),
    source: text("source"),
    sourceUrl: text("source_url"),
    description: text("description").notNull(),
    requirements: text("requirements"),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    notes: text("notes"),
    status: jobStatus("status").notNull().default("SAVED"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("jobs_public_id_idx").on(table.publicId),
    index("jobs_user_status_created_idx").on(table.userId, table.status, table.createdAt),
    index("jobs_user_title_company_idx").on(table.userId, table.title, table.company),
  ],
);

export const applicationAnalyses = pgTable(
  "application_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    ...userOwned,
    applicationId: uuid("application_id"),
    resumeVersionId: uuid("resume_version_id")
      .notNull()
      .references(() => resumeVersions.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    status: analysisStatus("status").notNull().default("PENDING"),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    inputHash: text("input_hash").notNull(),
    resultJson: jsonb("result_json"),
    rawResponse: jsonb("raw_response"),
    overallScore: integer("overall_score"),
    atsScore: integer("ats_score"),
    durationMs: integer("duration_ms"),
    failureReason: text("failure_reason"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("application_analyses_public_id_idx").on(table.publicId),
    uniqueIndex("application_analyses_user_input_hash_idx").on(
      table.userId,
      table.inputHash,
    ),
    index("application_analyses_user_status_idx").on(table.userId, table.status),
    index("application_analyses_application_idx").on(table.applicationId),
  ],
);

export const userEvidenceCorrections = pgTable(
  "user_evidence_corrections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...userOwned,
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => applicationAnalyses.id, { onDelete: "cascade" }),
    requirementKey: text("requirement_key").notNull(),
    requirement: text("requirement").notNull(),
    markedIncorrect: boolean("marked_incorrect").notNull().default(false),
    evidence: text("evidence"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("user_evidence_corrections_user_idx").on(table.userId),
    uniqueIndex("user_evidence_corrections_analysis_requirement_idx").on(
      table.analysisId,
      table.requirementKey,
    ),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    ...userOwned,
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, {
      onDelete: "set null",
    }),
    analysisId: uuid("analysis_id").references(() => applicationAnalyses.id, {
      onDelete: "set null",
    }),
    status: applicationStatus("stage").notNull().default("PENDING"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    followUpAt: timestamp("follow_up_at", { withTimezone: true }),
    interviewAt: timestamp("interview_at", { withTimezone: true }),
    notes: text("notes"),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("applications_public_id_idx").on(table.publicId),
    uniqueIndex("applications_user_job_idx").on(table.userId, table.jobId),
    index("applications_user_stage_idx").on(table.userId, table.status),
    index("applications_user_follow_up_idx").on(table.userId, table.followUpAt),
  ],
);

export const applicationActivities = pgTable(
  "application_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...userOwned,
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [
    index("application_activities_application_idx").on(table.applicationId),
    index("application_activities_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const generatedDocuments = pgTable(
  "generated_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    ...userOwned,
    type: documentType("type").notNull(),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, {
      onDelete: "set null",
    }),
    fileAssetId: uuid("file_asset_id").references(() => fileAssets.id, {
      onDelete: "set null",
    }),
    promptVersion: text("prompt_version").notNull(),
    originalContent: text("original_content").notNull(),
    editedContent: text("edited_content").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("generated_documents_public_id_idx").on(table.publicId),
    index("generated_documents_user_type_idx").on(table.userId, table.type),
  ],
);

export const documentActivityKind = pgEnum("document_activity_kind", [
  "CREATED",
  "EDITED",
  "ADDED_TO_LIBRARY",
]);

export const documentActivities = pgTable(
  "document_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...userOwned,
    documentId: uuid("document_id")
      .notNull()
      .references(() => generatedDocuments.id, { onDelete: "cascade" }),
    kind: documentActivityKind("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("document_activities_document_idx").on(table.documentId, table.createdAt),
  ],
);

export const aiUsageEvents = pgTable(
  "ai_usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...userOwned,
    action: usageAction("action").notNull(),
    status: usageStatus("status").notNull(),
    provider: text("provider"),
    model: text("model"),
    inputHash: text("input_hash"),
    costUnits: integer("cost_units"),
    failureReason: text("failure_reason"),
    ...timestamps,
  },
  (table) => [
    index("ai_usage_events_user_action_created_idx").on(
      table.userId,
      table.action,
      table.createdAt,
    ),
    index("ai_usage_events_user_status_idx").on(table.userId, table.status),
  ],
);

export const aiUsageReservations = pgTable(
  "ai_usage_reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...userOwned,
    action: usageAction("action").notNull(),
    reservedAt: timestamp("reserved_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("ai_usage_reservations_user_action_idx").on(table.userId, table.action),
    index("ai_usage_reservations_active_idx").on(table.userId, table.expiresAt),
  ],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    defaultResumeId: uuid("default_resume_id").references(() => resumes.id, {
      onDelete: "set null",
    }),
    timezone: text("timezone").notNull().default("UTC"),
    reducedMotion: boolean("reduced_motion").notNull().default(false),
    settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_preferences_user_idx").on(table.userId)],
);

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  resumes: many(resumes),
  jobs: many(jobs),
  applications: many(applications),
  preferences: one(userPreferences),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  versions: many(resumeVersions),
}));

export const resumeVersionsRelations = relations(resumeVersions, ({ one, many }) => ({
  resume: one(resumes, {
    fields: [resumeVersions.resumeId],
    references: [resumes.id],
  }),
  fileAsset: one(fileAssets, {
    fields: [resumeVersions.fileAssetId],
    references: [fileAssets.id],
  }),
  analyses: many(applicationAnalyses),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, { fields: [jobs.userId], references: [users.id] }),
  applications: many(applications),
  analyses: many(applicationAnalyses),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  activities: many(applicationActivities),
  documents: many(generatedDocuments),
}));

export const applicationAnalysesRelations = relations(
  applicationAnalyses,
  ({ one }) => ({
    user: one(users, {
      fields: [applicationAnalyses.userId],
      references: [users.id],
    }),
    resumeVersion: one(resumeVersions, {
      fields: [applicationAnalyses.resumeVersionId],
      references: [resumeVersions.id],
    }),
    job: one(jobs, {
      fields: [applicationAnalyses.jobId],
      references: [jobs.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type ResumeVersion = typeof resumeVersions.$inferSelect;
export type NewResumeVersion = typeof resumeVersions.$inferInsert;
export type FileAsset = typeof fileAssets.$inferSelect;
export type NewFileAsset = typeof fileAssets.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type ApplicationActivity = typeof applicationActivities.$inferSelect;
export type ApplicationAnalysis = typeof applicationAnalyses.$inferSelect;
export type NewApplicationAnalysis = typeof applicationAnalyses.$inferInsert;
export type UserEvidenceCorrection = typeof userEvidenceCorrections.$inferSelect;
export type DocumentActivity = typeof documentActivities.$inferSelect;
export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type NewGeneratedDocument = typeof generatedDocuments.$inferInsert;
export type UsageAction = (typeof usageAction.enumValues)[number];

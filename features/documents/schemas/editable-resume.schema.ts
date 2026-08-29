import { z } from "zod";
import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";

export const MAX_EDITED_RESUME_BYTES = 100_000;

const LIMITS = {
  name: 200,
  headline: 300,
  contact: 200,
  link: 300,
  links: 10,
  summary: 4_000,
  skillGroups: 30,
  skillCategory: 120,
  skillItems: 60,
  skillItem: 200,
  experience: 30,
  company: 200,
  title: 200,
  location: 200,
  date: 60,
  bullets: 30,
  bullet: 2_000,
  projects: 30,
  projectName: 200,
  technologies: 40,
  technology: 120,
  education: 20,
  qualification: 300,
  institution: 300,
  certifications: 30,
  certificationName: 300,
  issuer: 200,
  additionalSections: 20,
  sectionTitle: 200,
  sectionItems: 40,
  sectionItem: 2_000,
} as const;

const trimmed = (max: number) => z.string().trim().max(max);
const required = (max: number, message: string) => trimmed(max).min(1, message);
const nullableText = (max: number) =>
  trimmed(max)
    .nullable()
    .transform((value) => (value ? value : null));

export const editableResumeSchema = z.object({
  header: z.object({
    name: required(LIMITS.name, "A name is required."),
    headline: required(LIMITS.headline, "A headline is required."),
    location: nullableText(LIMITS.contact),
    email: nullableText(LIMITS.contact),
    phone: nullableText(LIMITS.contact),
    links: z.array(trimmed(LIMITS.link).min(1)).max(LIMITS.links),
  }),
  professionalSummary: trimmed(LIMITS.summary),
  skills: z
    .array(
      z.object({
        category: required(LIMITS.skillCategory, "A category is required."),
        items: z
          .array(trimmed(LIMITS.skillItem).min(1))
          .max(LIMITS.skillItems),
      }),
    )
    .max(LIMITS.skillGroups),
  experience: z
    .array(
      z.object({
        company: required(LIMITS.company, "A company is required."),
        title: required(LIMITS.title, "A job title is required."),
        location: nullableText(LIMITS.location),
        startDate: trimmed(LIMITS.date),
        endDate: trimmed(LIMITS.date),
        bullets: z.array(trimmed(LIMITS.bullet).min(1)).max(LIMITS.bullets),
      }),
    )
    .max(LIMITS.experience),
  projects: z
    .array(
      z.object({
        name: required(LIMITS.projectName, "A project name is required."),
        technologies: z
          .array(trimmed(LIMITS.technology).min(1))
          .max(LIMITS.technologies),
        bullets: z.array(trimmed(LIMITS.bullet).min(1)).max(LIMITS.bullets),
      }),
    )
    .max(LIMITS.projects),
  education: z
    .array(
      z.object({
        qualification: required(
          LIMITS.qualification,
          "A qualification is required.",
        ),
        institution: required(
          LIMITS.institution,
          "An institution is required.",
        ),
        date: nullableText(LIMITS.date),
      }),
    )
    .max(LIMITS.education),
  certifications: z
    .array(
      z.object({
        name: required(
          LIMITS.certificationName,
          "A certification name is required.",
        ),
        issuer: nullableText(LIMITS.issuer),
        date: nullableText(LIMITS.date),
      }),
    )
    .max(LIMITS.certifications),
  additionalSections: z
    .array(
      z.object({
        title: required(LIMITS.sectionTitle, "A section title is required."),
        items: z
          .array(trimmed(LIMITS.sectionItem).min(1))
          .max(LIMITS.sectionItems),
      }),
    )
    .max(LIMITS.additionalSections),
});

export type EditableResume = z.infer<typeof editableResumeSchema>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function list(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function textList(value: unknown) {
  return list(value)
    .map((item) => text(item))
    .filter(Boolean);
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeEditableResume(input: unknown) {
  const source = record(input);
  const header = record(source.header);

  return {
    header: {
      name: text(header.name),
      headline: text(header.headline),
      location: text(header.location) || null,
      email: text(header.email) || null,
      phone: text(header.phone) || null,
      links: textList(header.links),
    },
    professionalSummary: text(source.professionalSummary),
    skills: list(source.skills)
      .map((group) => {
        const entry = record(group);

        return { category: text(entry.category), items: textList(entry.items) };
      })
      .filter((group) => group.category && group.items.length > 0),
    experience: list(source.experience)
      .map((entry) => {
        const item = record(entry);

        return {
          company: text(item.company),
          title: text(item.title),
          location: text(item.location) || null,
          startDate: text(item.startDate),
          endDate: text(item.endDate),
          bullets: textList(item.bullets),
        };
      })
      .filter((entry) => entry.company && entry.title),
    projects: list(source.projects)
      .map((entry) => {
        const item = record(entry);

        return {
          name: text(item.name),
          technologies: textList(item.technologies),
          bullets: textList(item.bullets),
        };
      })
      .filter((entry) => entry.name),
    education: list(source.education)
      .map((entry) => {
        const item = record(entry);

        return {
          qualification: text(item.qualification),
          institution: text(item.institution),
          date: text(item.date) || null,
        };
      })
      .filter((entry) => entry.qualification && entry.institution),
    certifications: list(source.certifications)
      .map((entry) => {
        const item = record(entry);

        return {
          name: text(item.name),
          issuer: text(item.issuer) || null,
          date: text(item.date) || null,
        };
      })
      .filter((entry) => entry.name),
    additionalSections: list(source.additionalSections)
      .map((entry) => {
        const item = record(entry);

        return { title: text(item.title), items: textList(item.items) };
      })
      .filter((entry) => entry.title && entry.items.length > 0),
  };
}

export function parseEditableResume(input: unknown) {
  const parsed = editableResumeSchema.safeParse(normalizeEditableResume(input));

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error };
  }

  const resume = parsed.data as ImprovedResume;

  if (JSON.stringify(resume).length > MAX_EDITED_RESUME_BYTES) {
    return { ok: false as const, error: null };
  }

  return { ok: true as const, resume };
}

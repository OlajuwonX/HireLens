import { z } from "zod";

export const improvedResumeContactSchema = z.object({
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  links: z.array(z.string().min(1)),
});

export const improvedResumeSkillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string().min(1)),
});

export const improvedResumeExperienceSchema = z.object({
  role: z.string().min(1),
  organisation: z.string().min(1),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string().min(1)),
});

export const improvedResumeEducationSchema = z.object({
  credential: z.string().min(1),
  institution: z.string().min(1),
  location: z.string().nullable(),
  completedOn: z.string().nullable(),
  detail: z.string().nullable(),
});

export const improvedResumeSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().min(1),
  contact: improvedResumeContactSchema,
  summary: z.string().min(1),
  skills: z.array(improvedResumeSkillGroupSchema),
  experience: z.array(improvedResumeExperienceSchema),
  education: z.array(improvedResumeEducationSchema),
  certifications: z.array(z.string().min(1)),
  changeNotes: z.array(z.string().min(1)),
});

export type ImprovedResume = z.infer<typeof improvedResumeSchema>;

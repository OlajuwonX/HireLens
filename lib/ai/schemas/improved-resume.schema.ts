import { z } from "zod";

export const improvedResumeHeaderSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  links: z.array(z.string().min(1)),
});

export const improvedResumeSkillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string().min(1)),
});

export const improvedResumeExperienceSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string().min(1)),
});

export const improvedResumeProjectSchema = z.object({
  name: z.string().min(1),
  technologies: z.array(z.string().min(1)),
  bullets: z.array(z.string().min(1)),
});

export const improvedResumeEducationSchema = z.object({
  qualification: z.string().min(1),
  institution: z.string().min(1),
  date: z.string().nullable(),
});

export const improvedResumeSchema = z.object({
  header: improvedResumeHeaderSchema,
  professionalSummary: z.string().min(1),
  skills: z.array(improvedResumeSkillGroupSchema),
  experience: z.array(improvedResumeExperienceSchema),
  projects: z.array(improvedResumeProjectSchema),
  education: z.array(improvedResumeEducationSchema),
});

export type ImprovedResume = z.infer<typeof improvedResumeSchema>;

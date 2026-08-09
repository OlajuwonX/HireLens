import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200, "Password is too long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const signInSchema = z.object({
  email: z.email("Enter a valid email address").max(320),
  password: z.string().min(1, "Enter your password").max(200),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name").max(120),
  email: z.email("Enter a valid email address").max(320),
  password: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

import { z } from "zod";
import { PASSWORD_MAX_LENGTH, unmetPasswordRules } from "./password-rules";

export const passwordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH, "Password is too long")
  .superRefine((password, ctx) => {
    for (const rule of unmetPasswordRules(password)) {
      ctx.addIssue({ code: "custom", message: rule.label });
    }
  });

export const signInSchema = z.object({
  email: z.email("Enter a valid email address").max(320),
  password: z.string().min(1, "Enter your password").max(PASSWORD_MAX_LENGTH),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name").max(120),
  email: z.email("Enter a valid email address").max(320),
  password: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

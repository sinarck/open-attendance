import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

const password = z.string().min(8, "Password must be at least 8 characters");

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or fewer")
  .regex(
    /^[a-z0-9_.]+$/,
    "Username can only include letters, numbers, underscores, and dots",
  );

export const loginFormSchema = z.object({ email, password });

export const signupFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    username,
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const getFormValues = (formData: FormData) =>
  Object.fromEntries(formData);

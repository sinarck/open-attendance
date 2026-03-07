import { z } from "zod";

const requiredString = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

const email = requiredString("Email").pipe(
  z.email("Enter a valid email address"),
);

const password = requiredString("Password").min(
  8,
  "Password must be at least 8 characters",
);

const username = requiredString("Username")
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or fewer")
  .regex(
    /^[a-zA-Z0-9_.]+$/,
    "Username can only include letters, numbers, underscores, and dots",
  );

export const loginFormSchema = z.object({
  email,
  password,
});

export const signupFormSchema = z
  .object({
    name: requiredString("Name").min(2, "Name must be at least 2 characters"),
    username,
    email,
    password,
    confirmPassword: requiredString("Confirm password").min(
      8,
      "Password must be at least 8 characters",
    ),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const getFormValues = (formData: FormData) =>
  Object.fromEntries(formData);

import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .pipe(z.email("Enter a valid email address."))
  .transform((value) => value.toLowerCase());

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
  next: z.string().max(512).optional(),
});

export const resetRequestSchema = z.object({ email });

export const PASSWORD_MIN_LENGTH = 10;

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(72, "Use at most 72 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "The passwords don't match.",
  });

/** Shape returned by every auth Server Action to its form (useActionState). */
export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirm", string>>;
  /** Echo the email back so a failed submit doesn't clear it. Never echo passwords. */
  email?: string;
};

export const initialAuthFormState: AuthFormState = { status: "idle" };

export function firstFieldErrors(error: z.ZodError): AuthFormState["fieldErrors"] {
  const out: NonNullable<AuthFormState["fieldErrors"]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if ((key === "email" || key === "password" || key === "confirm") && !out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}

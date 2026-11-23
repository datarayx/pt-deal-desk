import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export const metadata: Metadata = { title: "New password" };

// Reached from the reset email via /auth/callback, which signs the user in first.
// The proxy sends anyone without a session back to /login.
export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}

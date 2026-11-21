import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Section } from "@/components/section";

export const metadata: Metadata = {
  title: "Reset password",
  description: "VYTRIX password reset surface. Auth backend required; no email is sent.",
};

export default function ForgotPasswordPage() {
  return (
    <Section className="flex items-center justify-center py-20">
      <AuthForm mode="forgot" />
    </Section>
  );
}

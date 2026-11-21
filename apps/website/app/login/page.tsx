import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Section } from "@/components/section";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to VYTRIX. Auth backend required; this form is a UI surface only.",
};

export default function LoginPage() {
  return (
    <Section className="flex items-center justify-center py-20">
      <AuthForm mode="login" />
    </Section>
  );
}

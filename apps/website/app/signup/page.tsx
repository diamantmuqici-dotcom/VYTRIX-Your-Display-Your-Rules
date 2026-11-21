import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Section } from "@/components/section";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a VYTRIX account. Auth backend required; this form is a UI surface only.",
};

export default function SignupPage() {
  return (
    <Section className="flex items-center justify-center py-20">
      <AuthForm mode="signup" />
    </Section>
  );
}

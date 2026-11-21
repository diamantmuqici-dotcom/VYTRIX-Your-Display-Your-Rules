"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./button";
import { GlassCard } from "./glass-card";

type Mode = "login" | "signup" | "forgot";

interface FormValues {
  email: string;
  password: string;
  confirm: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

const copy: Record<
  Mode,
  { eyebrow: string; title: string; description: string; action: string }
> = {
  login: {
    eyebrow: "Account access",
    title: "Sign in",
    description: "Enter the email tied to your VYTRIX account.",
    action: "Continue",
  },
  signup: {
    eyebrow: "New account",
    title: "Create account",
    description: "Start with the email you want on your license.",
    action: "Continue",
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "Reset password",
    description: "We will show where a reset link would be sent once auth is connected.",
    action: "Continue",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const [values, setValues] = useState<FormValues>({
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  const text = copy[mode];

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!values.email.trim()) {
      next.email = "Enter an email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (mode !== "forgot") {
      if (!values.password) {
        next.password = "Enter a password.";
      } else if (mode === "signup" && values.password.length < 8) {
        next.password = "Use at least 8 characters.";
      }
    }

    if (mode === "signup" && values.confirm !== values.password) {
      next.confirm = "Passwords do not match.";
    }

    return next;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage(null);
      return;
    }

    setMessage(
      "Auth backend required. No request was sent and no account state changed.",
    );
  };

  return (
    <GlassCard className="w-full max-w-md p-6 sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-cyan">
        {text.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">
        {text.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text.description}</p>

      <div className="mt-5 rounded-sm border border-[color:var(--line)] bg-elevated/40 px-3 py-2.5 text-xs leading-relaxed text-muted">
        Demo surface. Validation runs in the browser only. An auth backend must
        be connected before sign-in works.
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor={`${mode}-email`} className="mb-2 block text-xs font-medium text-muted">
            Email
          </label>
          <input
            id={`${mode}-email`}
            type="email"
            autoComplete="email"
            className="field"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={errors.email ? true : false}
            aria-describedby={errors.email ? `${mode}-email-error` : undefined}
          />
          {errors.email ? (
            <p id={`${mode}-email-error`} className="mt-1.5 text-xs text-brand-cyan">
              {errors.email}
            </p>
          ) : null}
        </div>

        {mode !== "forgot" ? (
          <div>
            <label htmlFor={`${mode}-password`} className="mb-2 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              id={`${mode}-password`}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="field"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              aria-invalid={errors.password ? true : false}
              aria-describedby={errors.password ? `${mode}-password-error` : undefined}
            />
            {errors.password ? (
              <p id={`${mode}-password-error`} className="mt-1.5 text-xs text-brand-cyan">
                {errors.password}
              </p>
            ) : null}
          </div>
        ) : null}

        {mode === "signup" ? (
          <div>
            <label htmlFor="signup-confirm" className="mb-2 block text-xs font-medium text-muted">
              Confirm password
            </label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              className="field"
              placeholder="Repeat your password"
              value={values.confirm}
              onChange={(event) => update("confirm", event.target.value)}
              aria-invalid={errors.confirm ? true : false}
              aria-describedby={errors.confirm ? "signup-confirm-error" : undefined}
            />
            {errors.confirm ? (
              <p id="signup-confirm-error" className="mt-1.5 text-xs text-brand-cyan">
                {errors.confirm}
              </p>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" fullWidth>
          {text.action}
        </Button>
      </form>

      {message ? (
        <p role="status" className="mt-5 rounded-sm border border-brand-cyan/25 bg-brand-cyan/5 px-3 py-2.5 text-xs leading-relaxed text-ink">
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        {mode === "login" ? (
          <>
            <Link href="/signup" className="hover:text-ink">Create account</Link>
            <Link href="/forgot-password" className="hover:text-ink">Forgot password</Link>
          </>
        ) : null}
        {mode === "signup" ? (
          <Link href="/login" className="hover:text-ink">Already have an account? Sign in</Link>
        ) : null}
        {mode === "forgot" ? (
          <Link href="/login" className="hover:text-ink">Back to sign in</Link>
        ) : null}
      </div>
    </GlassCard>
  );
}

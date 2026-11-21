"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./providers";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors duration-300 ease-bench hover:bg-elevated/70 hover:text-ink"
    >
      {theme === "dark" ? (
        <Sun size={18} strokeWidth={1.8} aria-hidden="true" />
      ) : (
        <Moon size={18} strokeWidth={1.8} aria-hidden="true" />
      )}
    </button>
  );
}

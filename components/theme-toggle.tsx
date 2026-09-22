"use client";

import { useEffect } from "react";

type Preference = "light" | "dark" | "system";

const order: Preference[] = ["system", "light", "dark"];

function resolve(preference: Preference): "light" | "dark" {
  if (preference === "light" || preference === "dark") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readPreference(): Preference {
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : "system";
}

function applyTheme(preference: Preference) {
  const theme = resolve(preference);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = theme;
  if (preference === "system") localStorage.removeItem("theme");
  else localStorage.setItem("theme", preference);
}

export function ThemeToggle() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readPreference() === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function onClick() {
    const current = readPreference();
    const next = order[(order.indexOf(current) + 1) % order.length];
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
      aria-label="Change color theme"
    >
      <span className="theme-label theme-label-system">System</span>
      <span className="theme-label theme-label-light">Light</span>
      <span className="theme-label theme-label-dark">Dark</span>
    </button>
  );
}

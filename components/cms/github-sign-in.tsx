"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export function GitHubSignIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        signIn("github", { redirect: false, redirectTo: "/admin" }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("timeout")), 20000);
        }),
      ]);
      if (!result?.ok || result.error || !result.url)
        throw new Error("authorization failed");
      const destination = new URL(result.url);
      if (
        destination.origin !== "https://github.com" ||
        destination.pathname !== "/login/oauth/authorize"
      )
        throw new Error("unexpected sign-in destination");
      // Auth.js's same-origin fetch stores the verification cookie before this
      // full-page navigation, rather than relying on a cross-site form redirect.
      window.location.assign(destination.href);
    } catch {
      setError(
        "GitHub could not be opened. Check your connection and try again. If this continues, open this website in Safari or your usual browser.",
      );
      setPending(false);
    } finally {
      clearTimeout(timer);
    }
  }

  return (
    <form action="/admin/sign-in" method="post" onSubmit={submit}>
      <button type="submit" className="studio-primary" disabled={pending}>
        {pending ? "Opening GitHub…" : "Continue with GitHub"}
      </button>
      <p role="status" aria-live="polite" className="studio-muted">
        {pending ? "Connecting securely to GitHub. Please wait…" : ""}
      </p>
      {error && (
        <p role="alert" className="studio-error">
          {error}
        </p>
      )}
    </form>
  );
}

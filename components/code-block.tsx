"use client";

import { useRef, useState, useEffect, type ComponentProps } from "react";

export function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const language = (props as Record<string, unknown>)["data-language"];
  const label = language === "ts" ? "TypeScript" : language === "js" ? "JavaScript" : typeof language === "string" ? language : "Code";

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    const code = container.current?.querySelector("pre code")?.textContent;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.replace(/\n$/, ""));
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="article-code" ref={container}>
      <div className="article-code-toolbar">
        <span>{label}</span>
        <button type="button" onClick={copy} aria-label={`Copy ${label} code`}>
          {status === "copied" ? "Copied" : "Copy code"}
        </button>
        <span className="sr-only" role="status">{status === "copied" ? "Code copied to clipboard" : status === "failed" ? "Copy was unavailable. Select the code to copy it." : ""}</span>
      </div>
      <pre {...props}>{children}</pre>
      {status === "failed" && <p className="px-5 pb-3 text-sm text-muted">Select the code to copy it.</p>}
    </div>
  );
}

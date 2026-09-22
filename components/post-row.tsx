import Link from "next/link";

export function PostRow({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta?: string;
}) {
  return (
    <li className="border-t border-border">
      <Link
        href={href}
        className="group flex items-baseline justify-between gap-6 py-3"
      >
        <span className="underline decoration-transparent underline-offset-[0.2em] transition-[text-decoration-color,opacity] duration-150 group-hover:decoration-foreground/50 group-focus-visible:decoration-foreground/50">
          {title}
        </span>
        {meta ? (
          <span className="shrink-0 font-mono text-[0.8125rem] text-muted">
            {meta}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

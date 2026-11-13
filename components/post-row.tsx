import Link from "next/link";

export function PostRow({
  href,
  title,
  summary,
  meta,
}: {
  href: string;
  title: string;
  summary: string;
  meta?: string;
}) {
  return (
    <li className="border-t border-border py-4">
      <Link
        href={href}
        className="font-medium underline decoration-foreground/25 underline-offset-[0.2em] hover:decoration-foreground focus-visible:decoration-foreground"
      >
        {title}
      </Link>
      <p className="mt-1 leading-[1.65]">{summary}</p>
      {meta && <p className="mt-2 text-sm text-muted">{meta}</p>}
    </li>
  );
}

import Link from "next/link";
import { site } from "@/config/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { getNotes, getPosts } from "@/lib/content";

function navigation() {
  const empty = new Set<string>();
  if (getPosts().length === 0) empty.add("/blog");
  if (getNotes().length === 0) empty.add("/notes");
  return site.navigation.filter((item) => !empty.has(item.href));
}

const navLink =
  "text-muted underline decoration-transparent underline-offset-[0.2em] transition-[color,text-decoration-color] duration-150 hover:text-foreground hover:decoration-foreground/40";

const metaLink =
  "text-sm text-muted underline decoration-transparent underline-offset-[0.2em] transition-[color,text-decoration-color] duration-150 hover:text-foreground hover:decoration-foreground/40";

export function Header({ nameAs = "p" }: { nameAs?: "h1" | "p" }) {
  const Name = nameAs;
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <Name className="text-[1.75rem] font-medium tracking-[-0.03em] sm:text-[2rem]">
          <Link href="/" className="transition-opacity duration-150 hover:opacity-70">
            {site.name}
          </Link>
        </Name>
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <a href={site.github} className={metaLink} rel="noreferrer" target="_blank">
            GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={site.x} className={metaLink} rel="noreferrer" target="_blank">
            X
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={site.linkedin} className={metaLink} rel="noreferrer" target="_blank">
            LinkedIn
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <ThemeToggle />
        </div>
      </div>
      <nav aria-label="Primary">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {navigation().map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={navLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

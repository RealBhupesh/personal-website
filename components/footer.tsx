import Link from "next/link";
import { site } from "@/config/site";

const item =
  "text-sm text-muted underline decoration-transparent underline-offset-[0.2em] transition-[color,text-decoration-color] duration-150 hover:text-foreground hover:decoration-foreground/40";

export function Footer() {
  return (
    <footer className="mt-20">
      <nav aria-label="Elsewhere">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          <li>
            <a href={site.github} className={item} rel="noreferrer" target="_blank">
              GitHub
            </a>
          </li>
          <li>
            <a href={site.linkedin} className={item} rel="noreferrer" target="_blank">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={site.x} className={item} rel="noreferrer" target="_blank">
              X
            </a>
          </li>
          <li>
            <a href={`mailto:${site.email}`} className={item}>
              Email
            </a>
          </li>
          <li>
            <Link href="/resume" className={item}>
              Resume
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
}

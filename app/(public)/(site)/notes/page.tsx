import { content } from "@/config/content";
import Link from "next/link";
import { getNotes } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: content.pages.notes.title,
  description: content.pages.notes.description,
  path: "/notes",
  noindex: getNotes().length === 0,
});

const noteLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

export default function NotesPage() {
  const notes = getNotes();

  return (
    <>
      <h1 className="section-title">{content.pages.notes.title}</h1>
      <p className="mt-4 leading-[1.75]">
        {content.pages.notes.intro}
      </p>
      {notes.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-x-10 gap-y-2 sm:grid-cols-2">
          {notes.map((note) => (
            <li key={note.slug} className="ml-4 list-disc marker:text-muted">
              <Link href={`/notes/${note.slug}`} className={noteLink}>
                {note.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 leading-[1.75]">
          {content.pages.notes.empty}
        </p>
      )}
    </>
  );
}

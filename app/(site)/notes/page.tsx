import Link from "next/link";
import { getNotes } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Notes",
  description: "Short observations on software, learning, and work in progress.",
  path: "/notes",
});

const noteLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

export default function NotesPage() {
  const notes = getNotes();

  return (
    <>
      <h1 className="section-title">Notes</h1>
      <p className="mt-4 leading-[1.75]">
        The smaller observations that accumulate while I&apos;m learning: a question from a book,
        something a project taught me, or an assumption I had to reconsider. I keep them here so I
        can return to them and see how my thinking changes.
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
          This is where I&apos;ll keep the smaller things worth remembering as I go.
        </p>
      )}
    </>
  );
}

import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { Mdx } from "@/components/mdx";
import { getNoteBySlug, getNotes } from "@/lib/content";
import { articleMetadata, noteArticleJsonLd } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getNotes().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);
  if (!note) return {};
  return articleMetadata({
    title: note.title,
    description: note.description,
    path: `/notes/${note.slug}`,
    image: `/og/notes/${note.slug}`,
  });
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);
  if (!note) notFound();

  return (
    <article>
      <JsonLd data={noteArticleJsonLd(note)} />
      <header>
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] sm:text-[2rem]">
          {note.title}
        </h1>
        <p className="mt-3 font-mono text-[0.8125rem] text-muted">{note.readingTime}</p>
        <p className="mt-4 leading-[1.75]">{note.description}</p>
      </header>
      <Mdx source={note.body} />
    </article>
  );
}

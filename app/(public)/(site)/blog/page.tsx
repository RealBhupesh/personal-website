import { content } from "@/config/content";
import Link from "next/link";
import { formatMonthYear, getNotes, getPosts } from "@/lib/content";
import { PostRow } from "@/components/post-row";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, pageMetadata, writingJsonLd } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: content.pages.blog.seoTitle || content.pages.blog.title,
  description: content.pages.blog.description,
  path: "/blog",
  noindex: getPosts().length === 0 && getNotes().length === 0,
});

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

export default function BlogPage() {
  const posts = getPosts();
  const notes = getNotes();

  return (
    <>
      <JsonLd data={writingJsonLd(posts)} />
      <JsonLd data={breadcrumbJsonLd([{ name: content.pages.blog.title, path: "/blog" }])} />
      <h1 className="section-title">{content.pages.blog.title}</h1>
      <p className="mt-4 leading-[1.75]">
        {content.pages.blog.intro}
      </p>
      {posts.length > 0 ? (
        <ul className="mt-8 border-b border-border">
          {posts.map((post) => (
            <PostRow
              key={post.slug}
              href={`/blog/${post.slug}`}
              title={post.title}
              summary={post.description}
              meta={`${formatMonthYear(post.date)} · ${post.readingTime}`}
            />
          ))}
        </ul>
      ) : notes.length === 0 && (
        <p className="mt-8 leading-[1.75]">
          I&apos;m putting my first pieces together. For now, you can{" "}
          <Link href="/work" className={textLink}>
            explore my work
          </Link>
          .
        </p>
      )}
      {notes.length > 0 && (
        <section className="mt-10" aria-labelledby="writing-notes">
          <h2 id="writing-notes" className="section-title">
            <Link href="/notes" className={textLink}>{content.pages.notes.title}</Link>
          </h2>
          <ul className="mt-4 border-b border-border">
            {notes.map((note) => (
              <PostRow
                key={note.slug}
                href={`/notes/${note.slug}`}
                title={note.title}
                summary={note.description}
                meta={note.readingTime}
              />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

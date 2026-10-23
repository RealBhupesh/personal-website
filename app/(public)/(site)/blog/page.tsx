import { content } from "@/config/content";
import Link from "next/link";
import { getPosts } from "@/lib/content";
import { formatMonthYear } from "@/lib/content";
import { PostRow } from "@/components/post-row";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: content.pages.blog.title,
  description: content.pages.blog.description,
  path: "/blog",
  noindex: getPosts().length === 0,
});

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

export default function BlogPage() {
  const posts = getPosts();

  return (
    <>
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
              meta={formatMonthYear(post.date)}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-8 leading-[1.75]">
          I&apos;m putting my first pieces together. For now, you can{" "}
          <Link href="/work" className={textLink}>
            explore my work
          </Link>
          .
        </p>
      )}
    </>
  );
}

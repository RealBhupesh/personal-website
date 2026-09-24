import Link from "next/link";
import { getPosts } from "@/lib/content";
import { formatMonthYear } from "@/lib/content";
import { PostRow } from "@/components/post-row";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Writing",
  description: "Essays on building software, working with AI, and thinking through ideas.",
  path: "/blog",
  noindex: getPosts().length === 0,
});

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

export default function BlogPage() {
  const posts = getPosts();

  return (
    <>
      <h1 className="section-title">Writing</h1>
      <p className="mt-4 leading-[1.75]">
        Writing helps me stay with a question long enough to discover what I actually think. Here,
        I write about building things, understanding people, and the ideas changing how I see my
        work and the world.
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

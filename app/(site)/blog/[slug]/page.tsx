import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { Mdx } from "@/components/mdx";
import { formatMonthYear, getPostBySlug, getPosts } from "@/lib/content";
import { articleMetadata, blogPostingJsonLd } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return articleMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    published: post.date,
    updated: post.updated,
    tags: post.tags,
    image: post.ogImage ?? `/og/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article>
      <JsonLd data={blogPostingJsonLd(post)} />
      <header>
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] sm:text-[2rem]">
          {post.title}
        </h1>
        <p className="mt-3 font-mono text-[0.8125rem] text-muted">
          {formatMonthYear(post.date)}
          {" · "}
          {post.readingTime}
          {post.updated ? ` · Updated ${formatMonthYear(post.updated)}` : ""}
        </p>
        <p className="mt-4 leading-[1.75]">{post.description}</p>
        {post.tags.length > 0 ? (
          <p className="mt-3 font-mono text-[0.8125rem] text-muted">
            {post.tags.join(", ")}
          </p>
        ) : null}
      </header>
      <Mdx source={post.body} />
    </article>
  );
}

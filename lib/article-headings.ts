export type ArticleHeading = { id: string; label: string; depth: number };

export function getArticleHeadings(source: string): ArticleHeading[] {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(source);
  const slugger = new GithubSlugger();
  const headings: ArticleHeading[] = [];
  visit(tree, "heading", (heading) => {
    const label = toString(heading);
    const id = slugger.slug(label);
    if (heading.depth === 2 || heading.depth === 3) {
      headings.push({ id, label, depth: heading.depth - 2 });
    }
  });
  return headings;
}
import GithubSlugger from "github-slugger";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

import { RailToc } from "@/components/ui/rail-toc";
import type { ArticleHeading } from "@/lib/article-headings";

export function ArticleToc({ items }: { items: ArticleHeading[] }) {
  if (!items.length) return null;
  return (
    <>
      <aside className="essay-toc-desktop" aria-label="Essay navigation">
        <div className="essay-toc-sticky">
          <RailToc items={items} offset={96} className="essay-rail" />
        </div>
      </aside>
      <details className="essay-toc-mobile">
        <summary>On this page</summary>
        <RailToc items={items} offset={32} className="essay-rail" />
      </details>
    </>
  );
}

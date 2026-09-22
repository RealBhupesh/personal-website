import type { TimelineItem } from "@/config/site";
import { timelineRange } from "@/config/site";

export function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <ol className="space-y-8">
      {items.map((item) => {
        const range = timelineRange(item);
        const meta = [item.place, range].filter(Boolean).join(" · ");
        return (
          <li key={`${item.title}-${range}`}>
            <h3 className="font-medium tracking-[-0.015em]">{item.title}</h3>
            {meta ? (
              <p className="mt-1 font-mono text-[0.8125rem] text-muted">{meta}</p>
            ) : null}
            {item.detail ? <p className="mt-2 leading-[1.75]">{item.detail}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

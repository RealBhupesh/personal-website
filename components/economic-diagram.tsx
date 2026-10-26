import { readFileSync } from "node:fs";
import { join } from "node:path";

const captions = {
  pipeline: "Events become an estimate through cleaning, weekly features, and validation. The output includes uncertainty, not just a number.",
  permissions: "Three separate access paths. Public statistics, a loan application, and an investigation each require their own checks.",
  evidence: "An invoice, a journey, and a settlement describe different parts of one transaction. A dashed link is an unmatched observation, not proof of fraud.",
} as const;

export function EconomicDiagram({ kind }: { kind: keyof typeof captions }) {
  if (!Object.hasOwn(captions, kind)) throw new Error("Unsupported economic diagram.");
  // Only the three locally authored plates above can be embedded by an article.
  const directory = join(process.cwd(), "public/writing/country-that-can-see-itself");
  const landscape = readFileSync(join(directory, `${kind}.svg`), "utf8");
  const portrait = readFileSync(join(directory, `${kind}-mobile.svg`), "utf8");
  return (
    <figure className="economic-diagram">
      <div className="diagram-landscape" dangerouslySetInnerHTML={{ __html: landscape }} />
      <div className="diagram-portrait" dangerouslySetInnerHTML={{ __html: portrait }} />
      <figcaption>{captions[kind]}</figcaption>
      <a href={`/writing/country-that-can-see-itself/${kind}.svg`} target="_blank" rel="noreferrer" className="diagram-full-size">
        View diagram at full size<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </figure>
  );
}

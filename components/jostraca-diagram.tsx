import { readFileSync } from "node:fs";
import { join } from "node:path";

type Kind = "two-phases" | "second-run-outcomes" | "proposed-default";
const captions: Record<Kind, string> = {
  "two-phases": "Jostraca's two phases: the file policy runs only after the tree is complete.",
  "second-run-outcomes": "What a second run does to a hand-edited file, by setup.",
  "proposed-default": "Proposed default: one extra comparison before any overwrite.",
};

export function JostracaDiagram({ kind }: { kind: Kind }) {
  // Trusted, locally authored SVGs. Kept as files so each diagram can also be opened or saved.
  const landscape = readFileSync(join(process.cwd(), "public/writing/jostraca", `${kind}.svg`), "utf8");
  const portrait = readFileSync(join(process.cwd(), "public/writing/jostraca", `${kind}-mobile.svg`), "utf8");
  return (
    <figure className="jostraca-diagram">
      <div className="diagram-landscape" dangerouslySetInnerHTML={{ __html: landscape }} />
      <div className="diagram-portrait" dangerouslySetInnerHTML={{ __html: portrait }} />
      <figcaption>{captions[kind]}</figcaption>
      <a href={`/writing/jostraca/${kind}.svg`} target="_blank" rel="noreferrer" className="diagram-full-size">
        View diagram at full size<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </figure>
  );
}

import { site } from "@/config/site";
import { pageMetadata } from "@/lib/metadata";
import { resumePdfExists } from "@/lib/resume";

export const metadata = pageMetadata({
  title: "Resume",
  description: "Resume of Bhupesh Cholake.",
  path: "/resume",
});

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

export default function ResumePage() {
  const hasPdf = resumePdfExists();

  return (
    <>
      <h1 className="section-title">Resume</h1>
      <p className="mt-4 leading-[1.75]">
        For a more structured look at my background, projects, and experience, here&apos;s my
        resume.
      </p>
      {hasPdf ? (
        <p className="mt-4">
          <a href="/resume.pdf" className={textLink}>
            Download resume
          </a>
        </p>
      ) : null}
      <p className="mt-10 leading-[1.75]">
        If you&apos;re working on a problem that needs someone curious, resourceful, and willing to
        take ownership, I&apos;d like to hear about it. Tell me what you&apos;re trying to make
        possible.
      </p>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        <a href={`mailto:${site.email}`} className={textLink}>
          Email me
        </a>
        <a href={site.github} className={textLink} rel="noreferrer" target="_blank">
          Find me on GitHub
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </>
  );
}

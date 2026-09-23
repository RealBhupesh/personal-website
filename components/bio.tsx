"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function paragraphs(text: string) {
  return text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export type BioImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  href?: string;
};

export function Bio({
  short,
  long,
  portrait,
  tech,
}: {
  short: string;
  long?: string;
  portrait?: BioImage;
  tech?: BioImage[];
}) {
  const [mode, setMode] = useState<"default" | "long">("default");
  const text = mode === "long" && long ? long : short;
  const showPictures = mode === "long";
  const parts = paragraphs(text);
  const splitAt = showPictures && portrait ? Math.floor(parts.length / 2) : parts.length;
  const before = parts.slice(0, splitAt);
  const after = parts.slice(splitAt);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="about-heading" className="section-title mb-0">
          About
        </h2>
        {long ? (
          <div className="flex items-baseline gap-3 text-sm">
            <button
              type="button"
              aria-pressed={mode === "default"}
              onClick={() => setMode("default")}
              className={
                mode === "default"
                  ? "text-foreground"
                  : "text-muted transition-colors duration-150 hover:text-foreground"
              }
            >
              Default
            </button>
            <button
              type="button"
              aria-pressed={mode === "long"}
              onClick={() => setMode("long")}
              className={
                mode === "long"
                  ? "text-foreground"
                  : "text-muted transition-colors duration-150 hover:text-foreground"
              }
            >
              Long
            </button>
          </div>
        ) : null}
      </div>
      <div className="space-y-4">
        {before.map((paragraph) => (
          <p key={paragraph} className="leading-[1.75]">
            {paragraph}
          </p>
        ))}
      </div>
      {showPictures && portrait ? (
        <figure className="my-8 flex flex-col items-center">
          <Image
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            className="h-auto w-full max-w-[18rem] rounded-2xl"
          />
          <figcaption className="mt-2 max-w-[18rem] text-sm leading-[1.6] text-muted">
            {portrait.caption}
          </figcaption>
        </figure>
      ) : null}
      {after.length > 0 ? (
        <div className="space-y-4">
          {after.map((paragraph) => (
            <p key={paragraph} className="leading-[1.75]">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
      {showPictures && tech && tech.length > 0 ? (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
          {tech.map((picture) => (
            <li key={picture.src}>
              <figure>
                {picture.href ? (
                  <Link href={picture.href}>
                    <Image
                      src={picture.src}
                      alt={picture.alt}
                      width={picture.width}
                      height={picture.height}
                      className="aspect-[4/3] h-auto w-full rounded-2xl object-cover"
                    />
                  </Link>
                ) : (
                  <Image
                    src={picture.src}
                    alt={picture.alt}
                    width={picture.width}
                    height={picture.height}
                    className="aspect-[4/3] h-auto w-full rounded-2xl object-cover"
                  />
                )}
                <figcaption className="mt-2 text-sm leading-[1.6] text-muted">
                  {picture.href ? (
                    <Link
                      href={picture.href}
                      className="underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80"
                    >
                      {picture.caption}
                    </Link>
                  ) : (
                    picture.caption
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

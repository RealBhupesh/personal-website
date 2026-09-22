import type { ComponentProps, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[color,text-decoration-color] duration-150 hover:decoration-foreground/80";

function Paragraph(props: ComponentProps<"p">) {
  return <p className="mb-5 leading-[1.75] last:mb-0" {...props} />;
}

function Heading2(props: ComponentProps<"h2">) {
  return (
    <h2
      className="mt-12 mb-3 text-[1.125rem] font-medium tracking-[-0.015em]"
      {...props}
    />
  );
}

function Heading3(props: ComponentProps<"h3">) {
  return (
    <h3 className="mt-8 mb-2 text-[1.0625rem] font-medium" {...props} />
  );
}

function Anchor({ href, children, ...props }: ComponentProps<"a">) {
  if (!href) return <a {...props}>{children}</a>;
  const external = href.startsWith("http");
  if (!external) {
    return (
      <Link href={href} className={textLink}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={textLink}
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function MdxImage({ src, alt, width, height }: ComponentProps<"img">) {
  if (!src || typeof src !== "string") return null;
  const numericWidth = typeof width === "number" ? width : Number(width) || 1600;
  const numericHeight =
    typeof height === "number" ? height : Number(height) || 1000;
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={numericWidth}
      height={numericHeight}
      sizes="(min-width: 640px) 608px, calc(100vw - 3rem)"
      className="my-8 h-auto w-full"
    />
  );
}

export function Figure({
  src,
  alt,
  width,
  height,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}) {
  return (
    <figure className="my-8">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 640px) 608px, calc(100vw - 3rem)"
        className="h-auto w-full"
      />
      {caption ? (
        <figcaption className="mt-2 text-sm leading-normal text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function Table(props: ComponentProps<"table">) {
  return (
    <div className="my-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.98rem]" {...props} />
    </div>
  );
}

export const mdxComponents = {
  h2: Heading2,
  h3: Heading3,
  p: Paragraph,
  a: Anchor,
  img: MdxImage,
  Figure,
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote
      className="my-8 border-l border-border pl-4 text-muted"
      {...props}
    />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="my-5 list-disc space-y-1.5 pl-5" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="my-5 list-decimal space-y-1.5 pl-5" {...props} />
  ),
  li: (props: ComponentProps<"li">) => (
    <li className="leading-[1.7] pl-1" {...props} />
  ),
  hr: (props: ComponentProps<"hr">) => (
    <hr className="my-10 border-border" {...props} />
  ),
  strong: (props: ComponentProps<"strong">) => (
    <strong className="font-medium" {...props} />
  ),
  table: Table,
  th: (props: ComponentProps<"th">) => (
    <th
      className="border-b border-border py-2 pr-6 font-medium align-bottom"
      {...props}
    />
  ),
  td: (props: ComponentProps<"td">) => (
    <td className="border-b border-border py-2 pr-6 align-top" {...props} />
  ),
  code: (props: ComponentProps<"code">) => <code {...props} />,
  pre: (props: ComponentProps<"pre">) => <pre {...props} />,
};

export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose mt-8">{children}</div>;
}

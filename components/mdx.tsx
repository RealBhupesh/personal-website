import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents, Prose } from "@/components/prose";
import { mdxOptions } from "@/lib/mdx";

export function Mdx({ source }: { source: string }) {
  return (
    <Prose>
      <MDXRemote source={source} components={mdxComponents} options={mdxOptions} />
    </Prose>
  );
}

import Link from "next/link";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="content" className="mt-14 sm:mt-16">
        <h1 className="section-title mb-4">Page not found</h1>
        <p className="leading-[1.75]">That page is not here.</p>
        <p className="mt-4">
          <Link
            href="/"
            className="underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80"
          >
            Home
          </Link>
        </p>
      </main>
    </>
  );
}

import { Header } from "@/components/header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main id="content" className="mt-14 sm:mt-16">
        {children}
      </main>
    </>
  );
}

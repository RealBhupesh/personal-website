import { Header } from "@/components/header";

export default function HomeLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header nameAs="h1" />
      <main id="content" className="mt-14 sm:mt-16">
        {children}
      </main>
    </>
  );
}

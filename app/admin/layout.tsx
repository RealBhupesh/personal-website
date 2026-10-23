import type { Metadata } from "next";
import "./studio.css";
export const metadata: Metadata = {
  title: "Writing studio",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="content" className="studio-root">
      {children}
    </main>
  );
}

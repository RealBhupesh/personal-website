import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/config/site";
import { personJsonLd } from "@/lib/metadata";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const themeScript = `(function(){try{var stored=localStorage.getItem("theme");var pref=stored==="light"||stored==="dark"?stored:"system";var dark=window.matchMedia("(prefers-color-scheme: dark)").matches;var theme=pref==="system"?(dark?"dark":"light"):pref;var root=document.documentElement;root.dataset.theme=theme;root.dataset.themePreference=pref;root.style.colorScheme=theme;}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", GeistSans.variable, GeistMono.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <script id="theme-script" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full font-sans">
        <JsonLd data={personJsonLd()} />
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <div className="relative z-10 mx-auto w-full max-w-[38rem] px-6 pt-16 pb-20 sm:pt-24 lg:max-w-[38rem] lg:px-8 lg:pt-20 lg:pb-24 lg:ml-[max(2rem,calc((100vw-min(30vw,28rem)-7rem-38rem)/2))] lg:mr-[calc(min(30vw,28rem)+7rem)]">
          {children}
          <Footer />
        </div>
        <aside className="pointer-events-none fixed top-12 right-[max(2rem,calc((100vw-min(100vw,88rem))/2+2rem))] bottom-12 z-0 hidden w-[min(30vw,28rem)] print:hidden lg:flex lg:items-start lg:justify-center">
          <Image
            src="/place.jpg"
            alt="Colourful pencil drawing of a riverside city inspired by Nashik, with temples, green mountains, and a sunset."
            width={682}
            height={1024}
            priority
            sizes="(min-width: 1024px) 28rem, 30vw"
            className="h-[min(80svh,calc(100svh-6rem))] w-full max-w-full rounded-2xl object-contain"
          />
        </aside>
      </body>
    </html>
  );
}

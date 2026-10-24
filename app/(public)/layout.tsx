import { content } from "@/config/content";
import Image from "next/image";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { personJsonLd } from "@/lib/metadata";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={personJsonLd()} />
      <div className="site-frame relative z-10 mx-auto w-full max-w-[38rem] px-6 pt-16 pb-20 sm:pt-24 lg:max-w-[38rem] lg:px-8 lg:pt-20 lg:pb-24 lg:ml-[max(2rem,calc((100vw-min(30vw,28rem)-7rem-38rem)/2))] lg:mr-[calc(min(30vw,28rem)+7rem)]">
        {children}
        <Footer />
      </div>
      <aside className="place-art pointer-events-none fixed top-12 right-[max(2rem,calc((100vw-min(100vw,88rem))/2+2rem))] bottom-12 z-0 hidden w-[min(30vw,28rem)] lg:flex lg:items-start lg:justify-center">
        <Image
          src={content.images.artwork.src}
          alt={content.images.artwork.alt}
          width={content.images.artwork.width}
          height={content.images.artwork.height}
          priority
          sizes="(min-width: 1024px) 28rem, 30vw"
          className="h-[min(80svh,calc(100svh-6rem))] w-full max-w-full rounded-2xl object-contain"
        />
      </aside>
    </>
  );
}

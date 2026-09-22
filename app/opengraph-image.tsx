import { site } from "@/config/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const alt = site.name;
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return createOgImage({ title: site.name, label: "AI engineer and builder" });
}

import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const alt = `${site.name}, ${profile.headline.toLowerCase()}`;
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return createOgImage({ title: site.name, label: profile.headline });
}

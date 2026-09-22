import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

let regular: Promise<Buffer> | undefined;
let medium: Promise<Buffer> | undefined;

function font(file: string) {
  return readFile(
    join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans", file),
  );
}

function loadFonts() {
  regular ??= font("Geist-Regular.ttf");
  medium ??= font("Geist-Medium.ttf");
  return Promise.all([regular, medium]);
}

export async function createOgImage({
  title,
  label,
}: {
  title: string;
  label?: string;
}) {
  const [regularFont, mediumFont] = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#121110",
          color: "#eceae4",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontFamily: "Geist",
            color: "#a39e96",
          }}
        >
          {site.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: title.length > 42 ? 60 : 72,
              lineHeight: 1.12,
              letterSpacing: -1.5,
              fontFamily: "Geist Medium",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          {label ? (
            <div
              style={{
                marginTop: 28,
                fontSize: 28,
                fontFamily: "Geist",
                color: "#a39e96",
              }}
            >
              {label}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Geist", data: regularFont, weight: 400 },
        { name: "Geist Medium", data: mediumFont, weight: 500 },
      ],
    },
  );
}

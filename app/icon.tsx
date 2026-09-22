import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121110",
          color: "#eceae4",
          fontSize: 18,
          letterSpacing: -0.5,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}

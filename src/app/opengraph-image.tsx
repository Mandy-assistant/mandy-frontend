import { ImageResponse } from "next/og";

export const alt = "Mandy — your personal assistant";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 96,
          background: "radial-gradient(circle at 85% 10%, #3b2a8a 0%, #0b0a12 55%)",
          color: "#f4f3fa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 9999,
            background: "radial-gradient(circle at 34% 28%, rgba(255,255,255,.75), rgba(255,255,255,0) 32%), linear-gradient(135deg, #7c5cff, #22d3ee)",
            boxShadow: "0 30px 90px -10px rgba(124,92,255,.7)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -4 }}>Mandy</div>
          <div style={{ fontSize: 36, color: "#a7a4bd", maxWidth: 640 }}>Daily brief, study tasks, jobs, roadmaps and tech news — one assistant.</div>
        </div>
      </div>
    ),
    size,
  );
}

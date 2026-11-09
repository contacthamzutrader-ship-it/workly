import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AventriqTalent - Pakistan's Smarter Freelancing Marketplace, Powered by AI.";
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #052411 0%, #093A1D 58%, #007A2A 100%)",
          fontFamily: "Arial, sans-serif",
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "rgba(0, 179, 60, 0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -140,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.06)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 40,
            background: "#FFFFFF",
            boxShadow: "0 26px 70px rgba(0, 0, 0, 0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 58,
              fontWeight: 900,
              letterSpacing: -7,
              color: "#093A1D",
            }}
          >
            AT
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 30,
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: -2,
            color: "#FFFFFF",
          }}
        >
          Aventriq<span style={{ color: "#00B33C" }}>Talent</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            maxWidth: 920,
            textAlign: "center",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: -2.5,
            color: "#FFFFFF",
          }}
        >
          Pakistan&apos;s Smarter Freelancing Marketplace, Powered by AI.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 25,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.72)",
          }}
        >
          Verified talent. Skill-based hiring. Escrow-protected payments.
        </div>
      </div>
    ),
    { ...size }
  );
}

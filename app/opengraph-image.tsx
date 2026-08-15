import { ImageResponse } from "next/og";

export const alt =
  "HireLens · Build a stronger application for every job you want";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#111312",
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            background: "#C5F85A",
            borderRadius: 6,
          }}
        />
        <div
          style={{
            color: "#F3F5F2",
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: -0.5,
          }}
        >
          HireLens
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            color: "#F3F5F2",
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: -2,
            maxWidth: 940,
          }}
        >
          Build a stronger application for every job you want.
        </div>
        <div
          style={{
            color: "#A7AEA9",
            fontSize: 30,
            lineHeight: 1.4,
            maxWidth: 880,
          }}
        >
          Analyze your resume against real job requirements, spot missing
          evidence and track everything from one workspace.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              background: "#1B1E1C",
              border: "1px solid #303530",
              borderRadius: 6,
              padding: "14px 22px",
            }}
          >
            <span style={{ color: "#C5F85A", fontSize: 40, fontWeight: 600 }}>
              82
            </span>
            <span style={{ color: "#747B76", fontSize: 24 }}>/ 100</span>
          </div>
          <div style={{ color: "#A7AEA9", fontSize: 26 }}>Job fit</div>
        </div>
      </div>
    </div>,
    size,
  );
}

import React from "react";

type AppIconMarkupProps = {
  size: number;
};

/** PNG / ImageResponse için tam ekran ikon (iOS ana ekran maskesi uyumlu). */
export function AppIconMarkup({ size }: AppIconMarkupProps) {
  const barWidth = Math.max(8, Math.round(size * 0.055));
  const barHeight = Math.round(size * 0.5);
  const fontSize = Math.round(size * 0.5);
  const barLeft = Math.round(size * 0.13);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0A",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: barLeft,
          top: "50%",
          transform: "translateY(-50%)",
          width: barWidth,
          height: barHeight,
          background: "#DBFF2B",
          borderRadius: barWidth / 2,
        }}
      />
      <div
        style={{
          fontSize,
          fontWeight: 900,
          color: "#DBFF2B",
          fontFamily: "Arial Black, Arial, sans-serif",
          letterSpacing: "-0.03em",
          marginLeft: Math.round(size * 0.05),
          lineHeight: 1,
        }}
      >
        G
      </div>
    </div>
  );
}

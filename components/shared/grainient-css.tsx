"use client";

import React from "react";

interface GrainientCSSProps {
  /** Optional: very slow drift animation (CSS-only, no rAF) */
  animate?: boolean;
  /** Optional: SVG noise overlay. Set to true for default strength, or 0–1 for custom opacity */
  grain?: boolean | number;
  /** Blob colors – more colors = more variation. Defaults use a range of blue tints/hues. */
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  color5?: string;
  className?: string;
}

/**
 * CSS-only gradient background. No WebGL, no JS animation loop.
 * Use for hero background with className="grayscale opacity-15" (or similar).
 * Much lighter than Grainient (OGL/WebGL).
 */
export default function GrainientCSS({
  animate = false,
  grain = false,
  color1 = "rgb(210 230 255)",
  color2 = "rgb(235 238 252)",
  color3 = "rgb(188 218 255)",
  color4 = "rgb(225 235 250)",
  color5 = "rgb(245 248 255)",
  className = "",
}: GrainientCSSProps) {
  const grainOpacity = grain === true ? 0.5 : typeof grain === "number" ? grain : 0;
  const showGrain = grain !== false && grainOpacity > 0;
  const c4 = color4 ?? color2;
  const c5 = color5 ?? color3;
  return (
    <div
      className={`absolute inset-0 h-full w-full overflow-hidden ${animate ? "grainient-drift" : ""} ${className}`.trim()}
      aria-hidden
      style={{
        background: `
          radial-gradient(ellipse 120% 100% at 5% 95%, ${color1} 0%, transparent 45%),
          radial-gradient(ellipse 100% 140% at 95% 10%, ${color2} 0%, transparent 50%),
          radial-gradient(ellipse 140% 90% at 50% 5%, ${color3} 0%, transparent 48%),
          radial-gradient(ellipse 80% 120% at 85% 70%, ${c4} 0%, transparent 55%),
          radial-gradient(ellipse 130% 130% at 15% 40%, ${color1} 0%, transparent 52%),
          radial-gradient(ellipse 160% 150% at 50% 55%, ${c5} 0%, transparent 70%)
        `,
        ...(animate && {
          backgroundSize: "140% 140%, 140% 140%, 140% 140%, 140% 140%, 140% 140%, 140% 140%",
          backgroundPosition: "5% 95%, 95% 10%, 50% 5%, 85% 70%, 15% 40%, 50% 55%",
        }),
      }}
    >
      {showGrain && (
        <svg
          className="absolute inset-0 h-full w-full mix-blend-overlay pointer-events-none"
          style={{ opacity: grainOpacity }}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <filter id="grainient-css-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.56" numOctaves="5" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            <feBlend in="SourceGraphic" in2="mono" mode="overlay" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grainient-css-grain)" />
        </svg>
      )}
    </div>
  );
}

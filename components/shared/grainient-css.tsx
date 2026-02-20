"use client";

import React from "react";

interface GrainientCSSProps {
  /** Optional: very slow drift animation (CSS-only, no rAF) */
  animate?: boolean;
  /** Optional: SVG noise overlay. Set to true for default strength, or 0–1 for custom opacity */
  grain?: boolean | number;
  /** Blob colors (ignored if you only use className for overlay) */
  color1?: string;
  color2?: string;
  color3?: string;
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
  color1 = "rgb(230 242 255)",
  color2 = "rgb(200 225 255)",
  color3 = "rgb(235 245 255)",
  className = "",
}: GrainientCSSProps) {
  const grainOpacity = grain === true ? 0.60 : typeof grain === "number" ? grain : 0;
  const showGrain = grain !== false && grainOpacity > 0;
  return (
    <div
      className={`absolute inset-0 h-full w-full overflow-hidden ${animate ? "grainient-drift" : ""} ${className}`.trim()}
      aria-hidden
      style={{
        background: `
          radial-gradient(ellipse 150% 120% at 10% 90%, ${color1} 0%, transparent 55%),
          radial-gradient(ellipse 140% 100% at 90% 80%, ${color2} 0%, transparent 55%),
          radial-gradient(ellipse 130% 110% at 50% 20%, ${color3} 0%, transparent 50%),
          radial-gradient(ellipse 120% 120% at 70% 50%, ${color2} 0%, transparent 60%),
          radial-gradient(ellipse 180% 180% at 50% 50%, ${color3} 0%, transparent 75%)
        `,
        ...(animate && {
          backgroundSize: "140% 140%, 140% 140%, 140% 140%, 140% 140%, 140% 140%",
          backgroundPosition: "0% 100%, 100% 80%, 50% 0%, 80% 50%, 50% 50%",
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
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            <feBlend in="SourceGraphic" in2="mono" mode="overlay" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grainient-css-grain)" />
        </svg>
      )}
    </div>
  );
}

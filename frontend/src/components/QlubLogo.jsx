import React from "react";

/**
 * qlub logo · 4-dot grid + lowercase "qlub" + "NYU | STERN" wordmark.
 * Matches Google AI Studio source layout.
 */
export default function QlubLogo({ className = "", showStern = true, size = "md", dark = false }) {
  const fg = dark ? "#ffffff" : "#0e0d13";
  const purple = "#7d00b5";
  const scale = size === "lg" ? 1.15 : size === "sm" ? 0.85 : 1;
  const dotPx = Math.round(9 * scale);
  const gapPx = Math.round(3 * scale);
  const iconBox = dotPx * 2 + gapPx;
  const qlubSize = Math.round(26 * scale);
  const sternSize = Math.round(11 * scale);

  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="qlub-logo">
      <div
        className="grid grid-cols-2"
        style={{ gap: gapPx, width: iconBox, height: iconBox }}
        aria-hidden="true"
      >
        <span style={{ background: purple, width: dotPx, height: dotPx, borderRadius: 2 }} />
        <span style={{ background: fg, width: dotPx, height: dotPx, borderRadius: 2 }} />
        <span style={{ background: fg, width: dotPx, height: dotPx, borderRadius: 2 }} />
        <span style={{ background: purple, width: dotPx, height: dotPx, borderRadius: 2 }} />
      </div>
      <span
        className="font-display font-black lowercase tracking-tight"
        style={{ color: fg, fontSize: qlubSize, lineHeight: 1 }}
      >
        qlub
      </span>
      {showStern && (
        <div
          className="font-display font-black uppercase tracking-[0.16em] flex items-center gap-2"
          style={{ color: purple, fontSize: sternSize }}
        >
          <span>NYU</span>
          <span className="inline-block" style={{ width: 1.2, height: sternSize + 2, background: purple, opacity: 0.55 }} />
          <span>STERN</span>
        </div>
      )}
    </div>
  );
}

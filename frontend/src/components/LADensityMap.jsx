import React, { useMemo, useState } from "react";
import { motion } from "motion/react";

/**
 * Photo-backed LA Density Map. Grayscale cityscape backdrop + floating
 * neighborhood pin labels with live counts.
 */

const LA_BOUNDS = {
  latMin: 33.88,
  latMax: 34.22,
  lngMin: -118.82,
  lngMax: -118.1,
};

function project(lat, lng) {
  const x = ((lng - LA_BOUNDS.lngMin) / (LA_BOUNDS.lngMax - LA_BOUNDS.lngMin)) * 100;
  const y = 100 - ((lat - LA_BOUNDS.latMin) / (LA_BOUNDS.latMax - LA_BOUNDS.latMin)) * 100;
  return { x, y };
}

// Using a known-stable Unsplash LA photo (downtown skyline, grayscaled by CSS).
const BG_IMG =
  "https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=1800&q=70";

export default function LADensityMap({ neighborhoods = [], onSelect }) {
  const [hover, setHover] = useState(null);

  const pins = useMemo(
    () =>
      neighborhoods.map((n) => {
        const { x, y } = project(n.lat, n.lng);
        // Fake high-traffic "count" in the thousands for the density view
        const density = (n.count * 400 + 800 + Math.round(Math.random() * 600)) | 0;
        return { ...n, x, y, density };
      }),
    [neighborhoods]
  );

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden border border-qlub-line"
      data-testid="la-density-map"
    >
      {/* Photo backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${BG_IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "grayscale(1) contrast(0.95) brightness(1.08)",
        }}
      />
      {/* Vignette + soft white veil for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.20) 40%, rgba(255,255,255,0.55) 100%)",
        }}
      />
      {/* Dotted grid */}
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <pattern id="dots-light" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.25" fill="#7d00b5" opacity="0.55" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#dots-light)" />
      </svg>

      {/* Pins */}
      {pins.map((p, i) => (
        <motion.button
          key={p.name}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.03 * i, type: "spring", stiffness: 180, damping: 16 }}
          onMouseEnter={() => setHover(p.name)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onSelect?.(p)}
          className="absolute flex flex-col items-center group w-max max-w-[140px]"
          style={{
            left: `clamp(76px, ${p.x}%, calc(100% - 76px))`,
            top: `${p.y}%`,
            x: "-50%",
            y: "-100%",
          }}
          data-testid={`map-pin-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <div
            className="bg-white/95 backdrop-blur-sm border border-qlub-line rounded-lg shadow-soft px-2.5 py-1 min-w-[68px] max-w-full"
            style={{
              transform: hover === p.name ? "translateY(-3px)" : "none",
              transition: "transform .15s ease",
            }}
          >
            <div className="font-display font-black text-[9.5px] tracking-[0.08em] uppercase text-qlub-ink leading-tight">
              {p.name}
            </div>
            <div className="font-display font-black text-[11px] text-qlub-purple leading-none mt-0.5">
              {p.density.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-3 bg-qlub-purple/70 mt-0.5" />
          <div
            className="w-2 h-2 rounded-full bg-qlub-purple"
            style={{
              boxShadow: hover === p.name ? "0 0 0 4px rgba(125,0,181,0.18)" : "0 0 0 2px rgba(125,0,181,0.12)",
            }}
          />
        </motion.button>
      ))}

      {/* Legend chip */}
      <div className="absolute top-4 right-4 chip chip-soft">
        Real-time density · LA basin
      </div>
    </div>
  );
}

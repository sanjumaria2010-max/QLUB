import React from "react";
import { motion } from "motion/react";

/** A brutalist "bento box" card */
export default function BentoCard({
  title,
  subtitle,
  kicker,
  children,
  className = "",
  dark = false,
  accent = "purple", // "purple" | "emerald" | "ink"
  padding = "p-5",
  delay = 0,
  testId,
}) {
  const shadow =
    accent === "emerald"
      ? "shadow-brut-emerald"
      : accent === "ink"
      ? "shadow-brut"
      : "shadow-brut-purple";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative brut-border ${dark ? "bg-qlub-ink text-qlub-paper" : "bg-white text-qlub-ink"} ${shadow} ${padding} ${className}`}
      data-testid={testId}
    >
      {(kicker || title) && (
        <div className="mb-3">
          {kicker && (
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.22em] mb-1 ${
                dark ? "text-qlub-paper/60" : "text-qlub-ink/55"
              }`}
            >
              {kicker}
            </div>
          )}
          {title && (
            <div className="font-display font-black uppercase leading-[0.95] tracking-tight text-xl">
              {title}
            </div>
          )}
          {subtitle && (
            <div className={`mt-1 text-xs ${dark ? "text-qlub-paper/60" : "text-qlub-ink/60"}`}>
              {subtitle}
            </div>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}

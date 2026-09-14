import React from "react";
import { motion } from "motion/react";

/**
 * Page header with "● KICKER" label + big headline.
 * The LAST word of `title` renders italic + purple (per source design).
 */
export default function PageHeader({ kicker, title, subtitle, right, chips, className = "" }) {
  const parts = (title || "").trim().split(/\s+/);
  const last = parts.pop();
  const head = parts.join(" ");

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex items-start justify-between gap-4 flex-wrap ${className}`}
      data-testid="page-header"
    >
      <div>
        {chips && <div className="flex items-center gap-2 mb-3">{chips}</div>}
        {kicker && <div className="section-label mb-3">{kicker}</div>}
        <h1 className="h-mega" data-testid="page-title">
          {head && <>{head} </>}
          <span className="h-accent">{last}</span>
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-qlub-text-muted leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0 flex items-center gap-3">{right}</div>}
    </motion.header>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";

/**
 * Plain-English hover tooltip. Wraps any child and shows a small card
 * on hover / focus with a headline + explanation. Also works on touch
 * (tap to toggle).
 *
 * Usage:
 *   <Tooltip title="What this means" body="Plain English explanation...">
 *     <MetricCard />
 *   </Tooltip>
 */
export default function Tooltip({ title, body, children, placement = "top", align = "center", testId }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  // Close when clicking outside (mobile tap behaviour)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const posCls =
    placement === "bottom"
      ? "top-full mt-2"
      : placement === "right"
      ? "left-full ml-2 top-2"
      : "bottom-full mb-2";

  // Horizontal alignment (prevents clipping on edges)
  const alignCls =
    align === "end"
      ? "right-0"
      : align === "start"
      ? "left-0"
      : "left-1/2 -translate-x-1/2";

  const arrowAlignCls =
    align === "end"
      ? "right-6"
      : align === "start"
      ? "left-6"
      : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={toggle}
      data-testid={testId}
    >
      {children}
      {/* Tiny info dot (visual cue that the card is hover-able) */}
      <span
        className={`absolute top-4 right-4 w-5 h-5 rounded-full bg-qlub-purple-50 text-qlub-purple flex items-center justify-center pointer-events-none transition-opacity ${
          open ? "opacity-100" : "opacity-60"
        }`}
        aria-hidden="true"
      >
        <Info className="w-3 h-3" />
      </span>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: placement === "bottom" ? -6 : 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "bottom" ? -4 : 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="tooltip"
            className={`absolute z-30 w-[220px] ${posCls} ${alignCls}`}
            data-testid={testId ? `${testId}-tip` : undefined}
          >
            <div className="rounded-2xl bg-qlub-ink text-white p-4 shadow-soft-lg border border-black/30">
              <div className="font-display font-black uppercase text-[10px] tracking-[0.22em] text-qlub-purple-400 mb-1.5 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                {title}
              </div>
              <p className="text-[13px] leading-relaxed text-white/90">{body}</p>
              {/* arrow */}
              {placement === "top" && (
                <div
                  className={`absolute ${arrowAlignCls} -bottom-1.5 w-3 h-3 rotate-45 bg-qlub-ink border-r border-b border-black/30`}
                  aria-hidden="true"
                />
              )}
              {placement === "bottom" && (
                <div
                  className={`absolute ${arrowAlignCls} -top-1.5 w-3 h-3 rotate-45 bg-qlub-ink border-l border-t border-black/30`}
                  aria-hidden="true"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

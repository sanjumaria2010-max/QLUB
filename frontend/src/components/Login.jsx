import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import QlubLogo from "./QlubLogo";
import { api } from "../lib/api";

/**
 * "Deep Dive" Login — fullscreen dark terminal vibe with 40+ pulsing
 * neon nodes representing restaurant clusters on a grayscale LA map.
 */
export default function Login({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lines, setLines] = useState([]);

  // Fake boot sequence
  useEffect(() => {
    const seq = [
      "> initializing qlub.intel v0.9.2 ...",
      "> linking NYU STERN research channel ...",
      "> geolocating target_market = LOS_ANGELES ...",
      "> loading restaurant clusters (64 live nodes) ...",
      "> sentiment engine: gemini-2.5-flash + googleSearch [READY]",
      "> awaiting credentials_",
    ];
    let i = 0;
    const id = setInterval(() => {
      setLines((s) => [...s, seq[i]]);
      i++;
      if (i >= seq.length) clearInterval(id);
    }, 420);
    return () => clearInterval(id);
  }, []);

  // 44 pseudo-random nodes across the viewport (clusters)
  const nodes = useMemo(() => {
    const rng = (seed) => () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const r = rng(42);
    return Array.from({ length: 44 }, (_, i) => ({
      id: i,
      x: 10 + r() * 80, // 10%..90%
      y: 12 + r() * 76,
      delay: r() * 2.5,
      emerald: r() > 0.78,
      size: 4 + Math.floor(r() * 6),
    }));
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();
    setError("");
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem("qlub_token", data.token);
      onAuthed(data.token);
    } catch (err) {
      setError("ACCESS DENIED — invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#05050a] text-qlub-paper scanlines"
      data-testid="login-screen"
    >
      {/* Grayscale LA satellite-ish backdrop (CSS gradients + noise) */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 30% 70%, #262634 0%, transparent 55%),
            radial-gradient(ellipse 50% 35% at 70% 35%, #1d1d28 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 55% 55%, #2a2a38 0%, transparent 60%),
            linear-gradient(180deg, #0a0a12 0%, #14141e 100%)
          `,
          filter: "grayscale(1) contrast(1.05)",
        }}
      />
      {/* Fake "highways" */}
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
        <g stroke="#888" strokeWidth="0.15" fill="none">
          <path d="M 0 60 Q 25 55 50 62 T 100 58" />
          <path d="M 0 35 Q 30 45 55 40 T 100 48" />
          <path d="M 15 0 Q 20 30 40 50 T 65 100" />
          <path d="M 75 0 Q 70 30 55 55 T 40 100" />
          <path d="M 0 85 L 100 80" />
        </g>
      </svg>

      {/* Dot-grid overlay */}
      <div className="absolute inset-0 dotgrid-dark opacity-40" />

      {/* 44 pulsing nodes */}
      <div className="absolute inset-0">
        {nodes.map((n) => (
          <React.Fragment key={n.id}>
            <span
              className={`node-ring ${n.emerald ? "emerald" : ""} animate-ping-slow`}
              style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${n.delay}s`, width: n.size * 2, height: n.size * 2 }}
            />
            <span
              className={`node-dot ${n.emerald ? "emerald" : ""} animate-pulse-node`}
              style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${n.delay}s`, width: n.size, height: n.size }}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-0 right-0 h-[2px] animate-scanline"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(125,0,181,0.75) 50%, transparent 100%)",
            boxShadow: "0 0 18px rgba(125,0,181,0.6)",
          }}
        />
      </div>

      {/* Top-left corner branding */}
      <div className="absolute top-6 left-6 z-10">
        <QlubLogo dark />
      </div>
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2 font-mono text-[10px] text-qlub-paper/70 uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-qlub-emerald animate-pulse" />
        live · los angeles · 34.05°N
      </div>

      {/* Center terminal */}
      <div className="relative z-10 h-full w-full flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-xl"
        >
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-qlub-emerald font-mono text-[11px] uppercase tracking-[0.25em] mb-2">
                <Terminal className="w-3.5 h-3.5" />
                qlub.intel // secure channel
              </div>
              <h1 className="h-display text-5xl md:text-6xl text-qlub-paper">
                DEEP<br />
                <span style={{ color: "#7d00b5" }}>DIVE.</span>
              </h1>
              <p className="mt-3 text-qlub-paper/60 max-w-sm text-sm">
                Market intelligence for the Los Angeles restaurant economy. Gated access.
              </p>
            </div>
          </div>

          <div
            className="border-2 border-qlub-paper/80 bg-black/60 backdrop-blur-sm p-5 font-mono text-[12.5px] leading-relaxed min-h-[190px]"
            style={{ boxShadow: "6px 6px 0 0 #7d00b5" }}
          >
            {lines.map((l, i) => (
              <div key={i} className={i === lines.length - 1 ? "text-qlub-emerald" : "text-qlub-paper/80"}>
                {l}
                {i === lines.length - 1 && lines.length >= 6 ? (
                  <span className="inline-block w-2 h-4 align-middle ml-1 bg-qlub-emerald animate-pulse" />
                ) : null}
              </div>
            ))}
            {lines.length >= 6 && (
              <form onSubmit={submit} className="mt-4 space-y-3" data-testid="login-form">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-qlub-paper/70" />
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email"
                    className="flex-1 bg-transparent outline-none text-qlub-paper placeholder:text-qlub-paper/40 border-b border-qlub-paper/30 focus:border-qlub-emerald py-1"
                    data-testid="login-email-input"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-qlub-paper/70" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="flex-1 bg-transparent outline-none text-qlub-paper placeholder:text-qlub-paper/40 border-b border-qlub-paper/30 focus:border-qlub-emerald py-1"
                    data-testid="login-password-input"
                  />
                  <button
                    type="submit"
                    disabled={loading || !password || !email}
                    className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-qlub-paper bg-qlub-purple hover:bg-qlub-purple-600 transition disabled:opacity-40 text-qlub-paper font-display font-black uppercase tracking-widest text-xs"
                    data-testid="login-submit-button"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? "auth..." : "enter"}
                  </button>
                </div>
              </form>
            )}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-red-400 text-xs"
                  data-testid="login-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.3em] text-qlub-paper/40">
            <span>v0.9.2 · build 2026.01</span>
            <span>nyu · stern research · qlub_la</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

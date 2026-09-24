import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import QlubLogo from "./QlubLogo";
import { Button } from "./ui/button";

// This is a welcome step, not authentication. Public API access is unchanged.
const ENTRY_KEY = "qlub_welcome_entered";

export default function Login({ children }) {
  const [entered, setEntered] = useState(() => {
    try {
      return sessionStorage.getItem(ENTRY_KEY) === "true";
    } catch {
      return false;
    }
  });

  const enter = () => {
    try {
      sessionStorage.setItem(ENTRY_KEY, "true");
    } catch {
      // Storage is optional: entry still works when the browser blocks it.
    }
    setEntered(true);
  };

  if (entered) return children;

  return (
    <main
      className="relative min-h-screen min-h-[100svh] flex flex-col bg-[#05050a] text-qlub-paper"
      data-testid="login-screen"
    >
      <div className="absolute inset-0 dotgrid-dark opacity-40 pointer-events-none" aria-hidden="true" />
      <header className="relative px-6 py-7 sm:px-10">
        <QlubLogo dark />
      </header>
      <div className="relative flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-qlub-emerald mb-4" data-testid="login-kicker">
            Qlub · LA Intelligence
          </p>
          <h1 className="font-display font-black text-5xl sm:text-6xl leading-none" data-testid="login-title">
            DEEP<br /><span className="text-qlub-purple">DIVE.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-qlub-paper/60" data-testid="login-description">
            Market intelligence for the Los Angeles restaurant economy.
          </p>
          <Button
            type="button"
            onClick={enter}
            className="mt-8 h-12 w-full sm:w-44 rounded-md bg-qlub-purple hover:bg-qlub-purple-700 text-white font-display font-bold text-base focus-visible:ring-2 focus-visible:ring-qlub-emerald"
            data-testid="login-submit-button"
          >
            Login <ArrowRight aria-hidden="true" />
          </Button>
        </motion.div>
      </div>
      <footer className="relative px-6 pb-6 sm:px-10 font-mono text-[10px] uppercase tracking-widest text-qlub-paper/40" data-testid="login-footer">
        NYU · Stern Research · Qlub LA
      </footer>
    </main>
  );
}
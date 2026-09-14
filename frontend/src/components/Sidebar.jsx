import React from "react";
import { motion } from "motion/react";
import { LayoutDashboard, Target, MessageSquareText, Store, LineChart, LogOut, ShieldCheck, BookOpen, FileDown } from "lucide-react";
import QlubLogo from "./QlubLogo";

const NAV = [
  { id: "overview", label: "Qlub Overview", icon: LayoutDashboard },
  { id: "icp", label: "ICP & Positioning", icon: Target },
  { id: "expo", label: "Restaurant Expo", icon: Store },
  { id: "voc", label: "Voice of Customer", icon: MessageSquareText },
  { id: "insights", label: "Marketing Insights", icon: LineChart },
];

export default function Sidebar({ active, onSelect, onLogout }) {
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-qlub-line flex flex-col z-20"
      data-testid="sidebar"
    >
      {/* Brand */}
      <div className="px-6 pt-7 pb-6 border-b border-qlub-line">
        <QlubLogo />
        <div className="mt-3 font-display font-semibold text-[10.5px] tracking-[0.26em] uppercase text-qlub-text-muted">
          LA Intelligence Unit
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5" aria-label="Primary">
        {NAV.map((item, i) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.25 }}
              onClick={() => onSelect(item.id)}
              data-testid={`nav-${item.id}`}
              className={`nav-pill ${isActive ? "nav-pill-active" : ""}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Secured footer card */}
      <div className="px-4 pb-4 pt-2">
        <div className="rounded-2xl p-4 bg-[#f5ecff] border border-qlub-purple-200">
          <div className="flex items-center gap-2 font-display font-black text-[11px] tracking-[0.18em] uppercase text-qlub-purple">
            <ShieldCheck className="w-3.5 h-3.5" />
            Qlub Secured
          </div>
          <p className="mt-1.5 text-[11.5px] leading-snug text-qlub-text-muted">
            Enterprise-grade encryption for Qlub executive strategy.
          </p>
        </div>

        {/* How to use deck */}
        <div className="mt-3 flex gap-2">
          <a
            href="/how-to-use.html"
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-qlub-line hover:border-qlub-purple hover:text-qlub-purple text-qlub-text-muted font-display font-bold uppercase text-[10.5px] tracking-[0.14em] transition"
            data-testid="how-to-use-link"
          >
            <BookOpen className="w-3.5 h-3.5" />
            How to Use
          </a>
          <a
            href="/qlub-how-to-use.pdf"
            download
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-qlub-purple text-white hover:bg-qlub-purple-700 font-display font-bold uppercase text-[10.5px] tracking-[0.14em] transition"
            title="Download deck as PDF"
            data-testid="how-to-use-pdf"
          >
            <FileDown className="w-3.5 h-3.5" />
            PDF
          </a>
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-qlub-line hover:border-qlub-purple hover:text-qlub-purple text-qlub-text-muted font-display font-bold uppercase text-[11px] tracking-[0.16em] transition"
          data-testid="logout-button"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

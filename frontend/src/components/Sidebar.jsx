import React, { useState } from "react";
import { motion } from "motion/react";
import { LayoutDashboard, Target, MessageSquareText, Store, LineChart, BookOpen, FileDown, Menu, X } from "lucide-react";
import QlubLogo from "./QlubLogo";
import { Button } from "./ui/button";

const NAV = [
  { id: "overview", label: "Qlub Overview", icon: LayoutDashboard },
  { id: "icp", label: "ICP & Positioning", icon: Target },
  { id: "expo", label: "Restaurant Expo", icon: Store },
  { id: "voc", label: "Voice of Customer", icon: MessageSquareText },
  { id: "insights", label: "Marketing Insights", icon: LineChart },
];

export default function Sidebar({ active, onSelect }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside
      className="relative lg:fixed left-0 top-0 bottom-0 w-full lg:w-[280px] bg-white border-b lg:border-r border-qlub-line flex flex-col z-20"
      data-testid="sidebar"
    >
      {/* Brand */}
      <div className="px-6 pt-7 pb-6 border-b border-qlub-line flex items-center justify-between gap-3">
        <div>
        <QlubLogo />
        <div className="mt-3 font-display font-semibold text-[10.5px] tracking-[0.26em] uppercase text-qlub-text-muted">
          LA Intelligence Unit
        </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="sidebar-navigation"
          onClick={() => setMobileOpen((open) => !open)}
          data-testid="mobile-nav-toggle"
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div id="sidebar-navigation" className={`${mobileOpen ? "flex" : "hidden"} lg:flex flex-1 flex-col min-h-0 overflow-y-auto`}>
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
              onClick={() => { onSelect(item.id); setMobileOpen(false); }}
              data-testid={`nav-${item.id}`}
              className={`nav-pill ${isActive ? "nav-pill-active" : ""}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Product guide */}
      <div className="px-4 pb-4 pt-2">
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

      </div>
      </div>
    </aside>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import ICP from "./pages/ICP";
import VoiceOfCustomer from "./pages/VoiceOfCustomer";
import RestaurantExpo from "./pages/RestaurantExpo";
import MarketingInsights from "./pages/MarketingInsights";
import { api } from "./lib/api";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("qlub_token"));
  const [route, setRoute] = useState("overview");
  const [restaurants, setRestaurants] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([api.restaurants(), api.neighborhoods()])
      .then(([r, n]) => {
        setRestaurants(r.restaurants || []);
        setNeighborhoods(n.neighborhoods || []);
      })
      .catch((e) => console.error("data load", e))
      .finally(() => setLoading(false));
  }, [token]);

  const onLogout = () => {
    localStorage.removeItem("qlub_token");
    setToken(null);
  };

  // ---- Exports ----
  const exportOverviewPdf = useCallback(() => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(125, 0, 181);
    doc.text("QLUB · LA MARKET INTEL", 40, 50);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(new Date().toLocaleString(), 40, 66);

    doc.setTextColor(10);
    doc.setFontSize(13);
    doc.text("Executive Summary", 40, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Tracked outlets: ${restaurants.length}\nNeighborhoods: ${neighborhoods.length}\nTop cluster: ${
        neighborhoods.sort((a, b) => b.count - a.count)[0]?.name || "-"
      }`,
      40,
      118
    );

    autoTable(doc, {
      startY: 170,
      head: [["Name", "Neighborhood", "Cuisine", "Owner", "Valuation", "POS", "Invest"]],
      body: restaurants.map((r) => [r.name, r.neighborhood, r.cuisine, r.owner, r.valuation, r.pos, r.investment]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [125, 0, 181], textColor: 255 },
      theme: "grid",
    });
    doc.save(`qlub-la-intel-${Date.now()}.pdf`);
  }, [restaurants, neighborhoods]);

  const exportRestaurantsPdf = useCallback((list) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(125, 0, 181);
    doc.text("QLUB · Restaurant Expo", 40, 50);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`${list.length} outlets · ${new Date().toLocaleDateString()}`, 40, 66);

    autoTable(doc, {
      startY: 90,
      head: [["Name", "Neighborhood", "Region", "Cuisine", "Valuation", "POS", "Segment"]],
      body: list.map((r) => [
        r.name,
        r.neighborhood,
        r.region || "",
        r.cuisine,
        r.valuation || "—",
        r.pos_verified ? r.pos_system : (r.segment === "no_modern_pos" ? "Cash / No modern POS" : "POS not detected"),
        r.segment === "prospect" ? "Prospect" : "Anti-Segment",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      theme: "grid",
    });
    doc.save(`qlub-expo-${Date.now()}.pdf`);
  }, []);

  const exportRestaurantsXlsx = useCallback((list) => {
    const ws = XLSX.utils.json_to_sheet(
      list.map((r) => ({
        Name: r.name,
        Neighborhood: r.neighborhood,
        Region: r.region || "",
        Cuisine: r.cuisine,
        Valuation: r.valuation || "",
        POS: r.pos_verified ? r.pos_system : (r.segment === "no_modern_pos" ? "Cash / No modern POS" : "POS not detected"),
        "POS Confidence": r.pos_confidence || "none",
        Segment: r.segment === "prospect" ? "Prospect" : "Anti-Segment",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Restaurants");
    XLSX.writeFile(wb, `qlub-expo-${Date.now()}.xlsx`);
  }, []);

  // ---- Render ----
  if (!token) {
    return <Login onAuthed={(t) => setToken(t)} />;
  }

  const content = (() => {
    if (loading)
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="font-mono text-sm text-qlub-ink/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-qlub-emerald animate-pulse" />
            loading LA intel ...
          </div>
        </div>
      );
    switch (route) {
      case "overview":
        return (
          <Overview
            restaurants={restaurants}
            neighborhoods={neighborhoods}
            onGoto={(r) => setRoute(r)}
            onExport={exportOverviewPdf}
          />
        );
      case "icp":
        return <ICP />;
      case "expo":
        return (
          <RestaurantExpo
            onExportPdf={exportRestaurantsPdf}
            onExportXlsx={exportRestaurantsXlsx}
          />
        );
      case "voc":
        return <VoiceOfCustomer />;
      case "insights":
        return <MarketingInsights />;
      default:
        return null;
    }
  })();

  return (
    <div className="App min-h-screen bg-qlub-paper" data-testid="app-shell">
      <Sidebar active={route} onSelect={setRoute} onLogout={onLogout} />

      <main className="pl-[280px]" data-testid="main-content">
        <div className="px-8 py-8 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {content}
            </motion.div>
          </AnimatePresence>
          <footer className="mt-14 pt-6 border-t border-qlub-line flex justify-between items-center font-mono text-[10px] uppercase tracking-widest text-qlub-text-muted">
            <span>qlub · la market intelligence · v0.9.2</span>
            <span>nyu · stern research · 2026.01</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

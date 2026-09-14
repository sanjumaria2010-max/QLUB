import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  MapPin,
  Quote,
  ExternalLink,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Zap,
  Copy,
  Check,
  X,
  Loader2,
  Mail,
  Globe,
  Info,
  Filter,
  Star,
  Lock,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { API, api } from "../lib/api";

const ISSUE_COLORS = {
  pos: { bg: "#f3e8ff", text: "#7d00b5", label: "POS Friction" },
  wait_time: { bg: "#fee2e2", text: "#b91c1c", label: "Wait Time" },
  billing: { bg: "#fef3c7", text: "#92400e", label: "Billing" },
  tipping: { bg: "#d1fae5", text: "#065f46", label: "Tipping" },
};

export default function VoiceOfCustomer() {
  const [filters, setFilters] = useState(null);
  const [location, setLocation] = useState("all");
  const [restaurantId, setRestaurantId] = useState("all");
  const [issue, setIssue] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pitch
  const [pitchOpen, setPitchOpen] = useState(false);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pitchTarget, setPitchTarget] = useState(null);

  // Load filter options once
  useEffect(() => {
    fetch(`${API}/voc-static/filters`).then((r) => r.json()).then(setFilters).catch(() => {});
  }, []);

  // Reload reviews whenever filters change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (location !== "all") params.set("location", location);
    if (restaurantId !== "all") params.set("restaurant_id", restaurantId);
    if (issue !== "all") params.set("issue", issue);
    fetch(`${API}/voc-static/reviews?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [location, restaurantId, issue]);

  // When location changes, reset restaurant filter (nested behaviour)
  useEffect(() => {
    setRestaurantId("all");
  }, [location]);

  const availableRestaurants = useMemo(() => {
    if (!filters) return [];
    if (location === "all") {
      return filters.regions.flatMap((r) => r.restaurants);
    }
    const r = filters.regions.find((x) => x.region === location);
    return r ? r.restaurants : [];
  }, [filters, location]);

  const stats = useMemo(() => {
    const byIssue = { pos: 0, wait_time: 0, billing: 0, tipping: 0 };
    const byRestaurant = {};
    for (const r of reviews) {
      byIssue[r.issue] = (byIssue[r.issue] || 0) + 1;
      byRestaurant[r.restaurant_name] = (byRestaurant[r.restaurant_name] || 0) + 1;
    }
    return { byIssue, byRestaurant, total: reviews.length };
  }, [reviews]);

  const openPitch = async (restaurantName, painPoints) => {
    setPitchTarget(restaurantName);
    setPitchOpen(true);
    setPitch(null);
    setPitchLoading(true);
    try {
      const res = await api.generateOutreach({
        restaurant: restaurantName,
        pain_points: painPoints,
      });
      setPitch(res);
    } catch (e) {
      setPitch({ subject: "Error", email: e.message || "Failed to generate pitch." });
    } finally {
      setPitchLoading(false);
    }
  };

  const copyPitch = async () => {
    if (!pitch) return;
    const text = `${pitch.subject}\n\n${pitch.email}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error("no clipboard");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // CSV export — client-side, no backend
  const exportCSV = () => {
    const headers = ["Restaurant", "Neighborhood", "Region", "Issue", "Source", "Date", "Quote", "URL"];
    const rows = reviews.map((r) => [
      r.restaurant_name,
      r.neighborhood,
      r.region,
      r.issue,
      r.source || "",
      r.date || "",
      (r.quote || "").replace(/"/g, '""'),
      r.source_url || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c)}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qlub-voc-${Date.now()}.csv`;
    a.click();
  };

  // PDF export
  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(125, 0, 181);
    doc.text("QLUB · Voice of Customer", 40, 50);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(
      `${reviews.length} quotes · ${grouped.length} restaurants · ${new Date().toLocaleDateString()}`,
      40,
      66
    );
    autoTable(doc, {
      startY: 90,
      head: [["Restaurant", "Neighborhood", "Issue", "Quote", "Source", "Date"]],
      body: reviews.map((r) => [
        r.restaurant_name,
        r.neighborhood,
        ISSUE_COLORS[r.issue]?.label || r.issue,
        r.quote || "",
        r.source || "",
        r.date || "",
      ]),
      styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [125, 0, 181], textColor: 255 },
      columnStyles: { 3: { cellWidth: 220 } },
      theme: "grid",
    });
    doc.save(`qlub-voc-${Date.now()}.pdf`);
  };

  // Excel export
  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(
      reviews.map((r) => ({
        Restaurant: r.restaurant_name,
        Neighborhood: r.neighborhood,
        Region: r.region,
        Issue: ISSUE_COLORS[r.issue]?.label || r.issue,
        Quote: r.quote || "",
        Source: r.source || "",
        Date: r.date || "",
        URL: r.source_url || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VoC Reviews");
    XLSX.writeFile(wb, `qlub-voc-${Date.now()}.xlsx`);
  };

  // Group reviews by restaurant for display
  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of reviews) {
      if (!m.has(r.restaurant_id)) m.set(r.restaurant_id, { restaurant: r, items: [] });
      m.get(r.restaurant_id).items.push(r);
    }
    return Array.from(m.values()).sort((a, b) => b.items.length - a.items.length);
  }, [reviews]);

  return (
    <div className="space-y-8" data-testid="page-voc">
      <PageHeader
        kicker="Voice of Customer"
        title="What LA diners actually say"
        subtitle="Real customer feedback pulled from Google, Yelp, Eater, Reddit, TripAdvisor — static snapshot, every quote cited. Select a restaurant to generate a tailored outreach email."
      />

      {/* Source banner */}
      <div className="soft-card p-5 border-l-4 border-qlub-purple" data-testid="voc-source-panel">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-qlub-purple-100 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-qlub-purple" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 font-display font-black uppercase text-[11px] tracking-[0.2em] text-qlub-purple mb-1">
              <Info className="w-3.5 h-3.5" />
              Dataset
            </div>
            <p className="text-[13px] text-qlub-ink leading-snug">
              <strong>{reviews.length ? reviews.length : stats.total} quotes</strong> across{" "}
              <strong>{grouped.length || "—"} restaurants</strong>, collected via Gemini googleSearch
              over public review platforms. Static snapshot — not live polling.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Filters: Location → Restaurant (nested) → Issue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FilterCard
          label="Location"
          value={location}
          onChange={(v) => setLocation(v)}
          testId="voc-filter-location"
          options={[
            { v: "all", l: "All LA" },
            ...(filters?.regions || []).map((r) => ({ v: r.region, l: `${r.region} (${r.count})` })),
          ]}
        />
        <FilterCard
          label="Restaurant"
          value={restaurantId}
          onChange={setRestaurantId}
          testId="voc-filter-restaurant"
          options={[
            { v: "all", l: `All in ${location === "all" ? "LA" : location}` },
            ...availableRestaurants.map((r) => ({ v: r.id, l: `${r.name} · ${r.neighborhood}` })),
          ]}
        />
        <FilterCard
          label="Issue"
          value={issue}
          onChange={setIssue}
          testId="voc-filter-issue"
          options={[
            { v: "all", l: "All Issues" },
            ...(filters?.issues || []).map((i) => ({ v: i.id, l: i.label })),
          ]}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatPill label="Total Quotes" value={stats.total} tone="purple" testId="voc-stat-total" />
        <StatPill label="POS Friction" value={stats.byIssue.pos || 0} tone="purple" />
        <StatPill label="Wait Time" value={stats.byIssue.wait_time || 0} tone="red" />
        <StatPill label="Billing" value={stats.byIssue.billing || 0} tone="amber" />
        <StatPill label="Tipping" value={stats.byIssue.tipping || 0} tone="emerald" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[13px] text-qlub-text-muted font-display font-semibold flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          {loading ? "Loading..." : `${reviews.length} quotes across ${grouped.length} restaurants`}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-qlub-line font-display font-bold uppercase text-[11px] tracking-[0.16em] text-qlub-ink hover:border-qlub-purple-200 hover:text-qlub-purple transition"
            data-testid="voc-export-csv-btn"
          >
            <Upload className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={exportPDF}
            disabled={reviews.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-qlub-line font-display font-bold uppercase text-[11px] tracking-[0.16em] text-qlub-ink hover:border-qlub-purple-200 hover:text-qlub-purple transition disabled:opacity-40"
            data-testid="voc-export-pdf-btn"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={exportXLSX}
            disabled={reviews.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-qlub-emerald text-white font-display font-bold uppercase text-[11px] tracking-[0.16em] hover:brightness-110 transition disabled:opacity-40"
            data-testid="voc-export-xlsx-btn"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX
          </button>
        </div>
      </div>

      {/* Customer Reviews grid + Outreach Agent sidebar */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT — reviews grid */}
        <div className="col-span-12 lg:col-span-9">
          <h2 className="font-display font-black text-2xl text-qlub-ink mb-4" data-testid="voc-reviews-heading">
            Customer Reviews: <span className="text-qlub-ink">{location === "all" ? "Greater LA Area" : location}</span>
          </h2>

          {loading ? (
            <div className="soft-card p-12 text-center text-qlub-text-muted">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="soft-card p-12 text-center">
              <div className="font-display font-black uppercase text-sm tracking-[0.2em] text-qlub-text-muted">
                No quotes match these filters
              </div>
              <p className="text-[13px] text-qlub-text-muted mt-2">Try broadening the filters above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="voc-reviews-grid">
              {reviews.map((rv, i) => (
                <ReviewCard key={i} review={rv} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Outreach Agent sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="lg:sticky lg:top-6" data-testid="outreach-agent">
            <div className="flex items-center justify-between mb-3">
              <div className="section-label section-label-bar">Outreach Agent</div>
              <span className="flex items-center gap-1.5 text-[10px] font-display font-black uppercase tracking-[0.18em] text-qlub-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-qlub-emerald animate-pulse" />
                {restaurantId !== "all" ? "Ready" : "Locked"}
              </span>
            </div>
            <div className="soft-card-lavender p-6">
              <div className="font-display font-black uppercase text-xl text-qlub-ink leading-tight">
                Closing<br />Console
              </div>
              {restaurantId === "all" ? (
                <>
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-white/60 border border-qlub-purple-100">
                    <Lock className="w-3.5 h-3.5 text-qlub-purple mt-0.5 shrink-0" />
                    <p className="text-[12px] text-qlub-ink/80 leading-relaxed">
                      Pick <strong>one restaurant</strong> in the filter above to generate a tailored outreach email.
                    </p>
                  </div>
                  <button
                    disabled
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-qlub-purple/40 text-white font-display font-black uppercase text-[12px] tracking-[0.18em] cursor-not-allowed"
                    data-testid="voc-generate-outreach-btn"
                  >
                    <Lock className="w-4 h-4" />
                    Select a Restaurant
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-4 text-[13px] text-qlub-ink/75 leading-relaxed">
                    Ready to draft a cold email for <strong>{availableRestaurants.find((x) => x.id === restaurantId)?.name || "this restaurant"}</strong>, grounded in the pain points visible below.
                  </p>
                  <button
                    onClick={() => {
                      const rest = availableRestaurants.find((x) => x.id === restaurantId);
                      if (!rest) return;
                      const pains = Array.from(
                        new Set(reviews.map((x) => ISSUE_COLORS[x.issue]?.label || x.issue))
                      );
                      openPitch(rest.name, pains);
                    }}
                    className="w-full mt-5 inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-qlub-purple text-white font-display font-black uppercase text-[12px] tracking-[0.18em] hover:bg-qlub-purple-700 transition shadow-lavender"
                    data-testid="voc-generate-outreach-btn"
                  >
                    <Zap className="w-4 h-4" />
                    Generate Outreach
                  </button>
                </>
              )}
            </div>

            {/* Quick stats under console */}
            <div className="mt-4 soft-card p-4 space-y-2.5">
              <div className="font-display font-black uppercase text-[9.5px] tracking-[0.2em] text-qlub-text-muted">
                Signal snapshot
              </div>
              <Signal label="Quotes in view" value={stats.total} />
              <Signal label="Restaurants" value={grouped.length} />
              <Signal label="Wait / billing heavy" value={(stats.byIssue.wait_time || 0) + (stats.byIssue.billing || 0)} tone="red" />
            </div>
          </div>
        </aside>
      </div>

      {/* Pitch modal */}
      <AnimatePresence>
        {pitchOpen && (
          <PitchModal
            target={pitchTarget}
            loading={pitchLoading}
            data={pitch}
            copied={copied}
            onCopy={copyPitch}
            onClose={() => setPitchOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterCard({ label, value, onChange, options, testId }) {
  return (
    <div className="soft-card p-5">
      <div className="font-display font-black uppercase text-[10px] tracking-[0.2em] text-qlub-purple">{label}</div>
      <div className="relative mt-3">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-transparent border-0 border-b border-qlub-line pb-2 pr-6 text-[14.5px] text-qlub-ink font-display font-semibold outline-none focus:border-qlub-purple"
          data-testid={testId}
        >
          {options.map((o) => (
            <option key={o.v} value={o.v}>
              {o.l}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-0 top-0.5 w-4 h-4 text-qlub-text-muted pointer-events-none" />
      </div>
    </div>
  );
}

function StatPill({ label, value, tone, testId }) {
  const colors = {
    purple: "#7d00b5",
    red: "#ef4444",
    amber: "#f59e0b",
    emerald: "#10b981",
  };
  return (
    <div className="soft-card p-4" data-testid={testId}>
      <div className="font-display font-black uppercase text-[9.5px] tracking-[0.2em] text-qlub-text-muted">
        {label}
      </div>
      <div
        className="font-display font-black mt-2 leading-none"
        style={{ color: colors[tone], fontSize: "1.9rem", letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
    </div>
  );
}

// ---------- Review Card (Google AI Studio mock layout) ----------
const SOURCE_COLORS = {
  Yelp: "#d32323",
  Google: "#4285f4",
  Reddit: "#ff4500",
  Eater: "#7d00b5",
  TripAdvisor: "#34e0a1",
  OpenTable: "#da3743",
};

const ISSUE_TAGS = {
  pos: ["posissues", "paymentdelay"],
  wait_time: ["checkdelay", "servicespeed"],
  billing: ["billing", "checkoutfriction"],
  tipping: ["tipping", "gratuity"],
};

const ISSUE_STARS = { pos: 2, wait_time: 3, billing: 3, tipping: 4 };

function relTime(dateStr) {
  if (!dateStr) return "recent";
  // Parse YYYY or YYYY-MM
  const m = /^(\d{4})(?:-(\d{1,2}))?/.exec(dateStr);
  if (!m) return dateStr;
  const y = parseInt(m[1], 10);
  const mo = m[2] ? parseInt(m[2], 10) : 1;
  const then = new Date(y, mo - 1, 1);
  const now = new Date();
  const months = Math.round((now - then) / (1000 * 60 * 60 * 24 * 30));
  if (months <= 0) return "this month";
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function ReviewCard({ review, index }) {
  const src = review.source || "Source";
  const srcColor = SOURCE_COLORS[src] || "#7d00b5";
  const initial = (src[0] || "R").toUpperCase();
  const stars = ISSUE_STARS[review.issue] ?? 4;
  const tags = ISSUE_TAGS[review.issue] || [review.issue || "feedback"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="soft-card p-5 flex flex-col"
      data-testid={`voc-review-card-${index}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-display font-black text-[15px] text-white shrink-0"
            style={{ background: srcColor }}
            title={`${src} · ${relTime(review.date)}`}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div
              className="font-display font-black text-[14px] text-qlub-ink truncate"
              title={review.restaurant_name}
            >
              {review.restaurant_name}
            </div>
            <div
              className="text-[11.5px] text-qlub-text-muted truncate"
              title={`${src} · ${review.neighborhood} · ${relTime(review.date)}`}
            >
              {relTime(review.date)} · via {src} · {review.neighborhood}
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-0.5 shrink-0"
          title={`${ISSUE_COLORS[review.issue]?.label || review.issue} · severity ${stars}/5`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="w-3.5 h-3.5"
              style={{
                color: i < stars ? "#f59e0b" : "#e5e7eb",
                fill: i < stars ? "#f59e0b" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      <span
        className="mt-4 self-start chip chip-soft"
        data-testid={`voc-review-rest-${index}`}
        title={`Issue category: ${ISSUE_COLORS[review.issue]?.label || review.issue}`}
      >
        {ISSUE_COLORS[review.issue]?.label || review.issue}
      </span>

      <div
        className="mt-3 flex-1 text-[13.5px] italic text-qlub-ink/85 leading-relaxed"
        title={review.quote}
      >
        "{review.quote}"
      </div>

      <div className="mt-4 pt-3 border-t border-qlub-line flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2 py-1 rounded-md bg-qlub-cream border border-qlub-line text-[10.5px] font-mono text-qlub-text-muted"
            >
              #{t}
            </span>
          ))}
        </div>
        {review.source_url && (
          <a
            href={review.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-qlub-purple hover:underline font-display font-bold uppercase tracking-wider"
          >
            <ExternalLink className="w-3 h-3" /> View
          </a>
        )}
      </div>
    </motion.div>
  );
}

function Signal({ label, value, tone }) {
  const color = tone === "red" ? "#ef4444" : "#0e0d13";
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11.5px] text-qlub-text-muted">{label}</span>
      <span className="font-display font-black text-[14px]" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function PitchModal({ target, loading, data, copied, onCopy, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-qlub-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="pitch-modal"
    >
      <motion.div
        initial={{ scale: 0.95, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.97, y: 8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-soft-lg p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-qlub-purple-50 text-qlub-text-muted hover:text-qlub-purple transition"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <div className="chip chip-soft">
            <Mail className="w-3 h-3" /> Pitch for {target}
          </div>
        </div>
        <h3 className="font-display font-black uppercase text-3xl text-qlub-ink leading-tight">
          Cold Email <span className="h-accent">Draft</span>
        </h3>
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-3 py-12 justify-center text-qlub-text-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Drafting your pitch via Gemini ...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="font-display font-black uppercase text-[10px] tracking-[0.2em] text-qlub-purple mb-1">
                  Subject
                </div>
                <div className="font-display font-bold text-[16px] text-qlub-ink">{data?.subject}</div>
              </div>
              <div>
                <div className="font-display font-black uppercase text-[10px] tracking-[0.2em] text-qlub-purple mb-1">
                  Body
                </div>
                <div className="rounded-2xl bg-qlub-cream border border-qlub-line p-4 text-[14px] text-qlub-ink leading-relaxed whitespace-pre-wrap">
                  {data?.email}
                </div>
              </div>
              <button
                onClick={onCopy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-qlub-purple text-white font-display font-bold uppercase text-[11px] tracking-[0.16em] hover:bg-qlub-purple-700 transition"
                data-testid="pitch-copy-btn"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Email"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

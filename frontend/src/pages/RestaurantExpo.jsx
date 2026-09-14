import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import {
  MapPin,
  Sparkles,
  TrendingUp,
  ChevronDown,
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  ShieldAlert,
  Info,
  Globe,
  ExternalLink,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { API } from "../lib/api";

export default function RestaurantExpo({ onExportPdf, onExportXlsx }) {
  const [q, setQ] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [posFilter, setPosFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [payload, setPayload] = useState(null);
  const [imported, setImported] = useState(null); // {rows, fileName}
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/expo/restaurants`).then((r) => r.json()).then(setPayload).catch(() => {});
  }, []);

  const restaurants = imported?.rows ?? payload?.restaurants ?? [];
  const source = payload?.source;

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (q && !`${r.name} ${r.cuisine} ${r.neighborhood}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (regionFilter !== "all" && r.region !== regionFilter) return false;
      if (cuisineFilter !== "all" && r.cuisine !== cuisineFilter) return false;
      if (segmentFilter !== "all" && r.segment !== segmentFilter) return false;
      if (posFilter !== "all") {
        if (posFilter === "not_detected") {
          // Prospect but no verified POS
          if (!(r.segment === "prospect" && !r.pos_verified)) return false;
        } else if (posFilter === "no_modern") {
          if (r.segment !== "no_modern_pos") return false;
        } else {
          // Specific POS system (Toast, Square, etc.)
          if (!r.pos_verified || r.pos_system !== posFilter) return false;
        }
      }
      return true;
    });
  }, [restaurants, q, regionFilter, cuisineFilter, segmentFilter, posFilter]);

  const regions = useMemo(
    () => ["all", ...Array.from(new Set(restaurants.map((r) => r.region))).sort()],
    [restaurants]
  );
  const cuisines = useMemo(
    () => ["all", ...Array.from(new Set(restaurants.map((r) => r.cuisine))).sort()],
    [restaurants]
  );
  const posSystems = useMemo(
    () =>
      Array.from(
        new Set(restaurants.filter((r) => r.pos_verified && r.pos_system).map((r) => r.pos_system))
      ).sort(),
    [restaurants]
  );

  // ---------- Import Excel / CSV ----------
  const normalizeImportRow = (raw, idx) => {
    // Map loosely-named headers to our row shape
    const lc = {};
    Object.entries(raw).forEach(([k, v]) => {
      lc[String(k).trim().toLowerCase()] = v;
    });
    const pick = (...keys) => {
      for (const k of keys) {
        const v = lc[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
      }
      return "";
    };
    const name = pick("name", "restaurant", "restaurant name");
    const neighborhood = pick("neighborhood", "area");
    const region = pick("region");
    const cuisine = pick("cuisine", "category");
    const valuation = pick("valuation", "value");
    const posRaw = pick("pos", "pos system", "pos_system");
    const segmentRaw = pick("segment", "category type").toLowerCase();
    const segment = segmentRaw.includes("anti") || segmentRaw.includes("no_modern") || segmentRaw.includes("cash")
      ? "no_modern_pos"
      : "prospect";
    const posVerified = !!posRaw && !/not detected|unknown|n\/a|-|cash/i.test(posRaw);
    return {
      id: `imported-${idx}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: name || `Row ${idx + 1}`,
      neighborhood,
      region: region || "Imported",
      cuisine,
      valuation: valuation || null,
      pos_system: posVerified ? posRaw : null,
      pos_verified: posVerified,
      pos_confidence: posVerified ? "imported" : "none",
      pos_evidence_url: null,
      pos_evidence_quote: null,
      segment,
      review_count: 0,
    };
  };

  const handleImportFile = async (file) => {
    setImportError("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!json.length) {
        setImportError("Sheet is empty. Expected columns: Name, Neighborhood, Region, Cuisine, Valuation, POS, Segment.");
        return;
      }
      const rows = json.map(normalizeImportRow);
      setImported({ rows, fileName: file.name });
      // Reset filters so the imported data is immediately visible
      setQ("");
      setRegionFilter("all");
      setCuisineFilter("all");
      setPosFilter("all");
      setSegmentFilter("all");
    } catch (e) {
      setImportError(`Couldn't read file: ${e.message || e}`);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImportFile(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  const clearImport = () => {
    setImported(null);
    setImportError("");
  };

  return (
    <div className="space-y-8" data-testid="page-expo">
      <PageHeader
        chips={[
          <span key="a" className="chip chip-solid">Verified Data</span>,
          <span key="b" className="chip chip-soft">Lead Database</span>,
        ]}
        title="Restaurant Expo"
        subtitle="Real LA venues — POS systems shown only when publicly verifiable. Everything else reads 'POS not detected'."
      />

      {/* Source Panel */}
      {source && (
        <div className="soft-card p-5 border-l-4 border-qlub-purple" data-testid="source-panel">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-qlub-purple-100 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-qlub-purple" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 font-display font-black uppercase text-[11px] tracking-[0.2em] text-qlub-purple mb-1">
                <Info className="w-3.5 h-3.5" />
                Data Source & Provenance
              </div>
              <p className="text-[13px] text-qlub-ink leading-snug">
                <strong>{source.method}</strong> over <em>{source.scope}</em>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="chip chip-outline">
                  {source.prospects_total} prospect venues
                </span>
                <span className="chip chip-emerald">
                  <CheckCircle2 className="w-3 h-3" />
                  {source.prospects_pos_verified} POS verified with public citation
                </span>
                <span className="chip chip-soft">
                  {source.no_modern_pos_total} no-modern-POS venues (anti-segment)
                </span>
              </div>
              <p className="mt-2 text-[12px] text-qlub-text-muted italic">{source.disclaimer}</p>
              {source.prospect_logic && (
                <details className="mt-3 group" data-testid="prospect-logic-details">
                  <summary className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-display font-black uppercase tracking-[0.16em] text-qlub-purple hover:underline">
                    <Info className="w-3 h-3" />
                    How we classify a Qlub Prospect
                  </summary>
                  <p className="mt-2 text-[12.5px] text-qlub-ink leading-relaxed border-l-2 border-qlub-purple-200 pl-3">
                    {source.prospect_logic}
                  </p>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="soft-card p-5 md:col-span-3 lg:col-span-2">
          <div className="flex items-center gap-2 text-qlub-purple font-display font-black uppercase text-[11px] tracking-[0.2em] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Search
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, cuisine, neighborhood..."
            className="w-full bg-transparent border-0 border-b border-qlub-line pb-1 text-[15px] text-qlub-ink outline-none focus:border-qlub-purple"
            data-testid="expo-search"
          />
        </div>
        <FilterCard label="Region" value={regionFilter} onChange={setRegionFilter} options={regions} testId="expo-filter-region" />
        <FilterCard label="Cuisine" value={cuisineFilter} onChange={setCuisineFilter} options={cuisines} testId="expo-filter-cuisine" />
        <FilterCard
          label="POS"
          value={posFilter}
          onChange={setPosFilter}
          options={[
            { v: "all", l: "All POS" },
            ...posSystems.map((s) => ({ v: s, l: `Verified · ${s}` })),
            { v: "not_detected", l: "POS not detected" },
            { v: "no_modern", l: "Cash / No modern POS" },
          ]}
          testId="expo-filter-pos"
        />
        <FilterCard
          label="Segment"
          value={segmentFilter}
          onChange={setSegmentFilter}
          options={[
            { v: "all", l: "All" },
            { v: "prospect", l: "Qlub Prospect" },
            { v: "no_modern_pos", l: "No Modern POS" },
          ]}
          testId="expo-filter-segment"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[13px] text-qlub-text-muted font-display font-semibold">
          {filtered.length} showing · {restaurants.length} total
          {imported && (
            <span className="ml-2 chip chip-soft" style={{ fontSize: 10 }}>
              Imported: {imported.fileName}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileChange}
            className="hidden"
            data-testid="expo-import-file-input"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-qlub-purple text-white font-display font-bold uppercase text-[11px] tracking-[0.16em] hover:bg-qlub-purple-700 transition"
            data-testid="expo-import-btn"
          >
            <Download className="w-3.5 h-3.5" /> Import Excel
          </button>
          {imported && (
            <button
              onClick={clearImport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-qlub-line font-display font-bold uppercase text-[11px] tracking-[0.16em] text-qlub-text-muted hover:text-red-600 hover:border-red-200 transition"
              data-testid="expo-clear-import-btn"
            >
              <X className="w-3.5 h-3.5" /> Clear Import
            </button>
          )}
          <button
            onClick={() => onExportPdf?.(filtered)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-qlub-line font-display font-bold uppercase text-[11px] tracking-[0.16em] text-qlub-ink hover:border-qlub-purple-200 hover:text-qlub-purple transition"
            data-testid="export-pdf-btn"
          >
            <Upload className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={() => onExportXlsx?.(filtered)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-qlub-emerald text-white font-display font-bold uppercase text-[11px] tracking-[0.16em] hover:brightness-110 transition"
            data-testid="export-xlsx-btn"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX
          </button>
        </div>
      </div>

      {importError && (
        <div className="soft-card p-4 border-l-4 border-red-400 text-[13px] text-red-700" data-testid="expo-import-error">
          {importError}
        </div>
      )}
      {imported && !importError && (
        <div className="soft-card p-4 border-l-4 border-qlub-emerald text-[13px] text-qlub-ink" data-testid="expo-import-banner">
          <strong>Imported {imported.rows.length} rows</strong> from <em>{imported.fileName}</em>. The table below now shows your uploaded data.
          Recognized columns: <span className="font-mono text-[11.5px]">Name, Neighborhood, Region, Cuisine, Valuation, POS, Segment</span>.
        </div>
      )}

      {/* Table */}
      <div className="soft-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="qlub-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Neighborhood</th>
                <th>Region</th>
                <th>Cuisine</th>
                <th>Valuation</th>
                <th>POS</th>
                <th>Segment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.2) }}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer"
                  data-testid={`expo-row-${r.id}`}
                >
                  <td>
                    <div className="font-display font-black text-qlub-purple text-[15px]">{r.name}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-[13px] text-qlub-ink">
                      <MapPin className="w-3.5 h-3.5 text-qlub-purple" />
                      {r.neighborhood}
                    </div>
                  </td>
                  <td>
                    <span className="chip chip-soft" style={{ fontSize: 9.5 }}>{r.region}</span>
                  </td>
                  <td>
                    <span className="chip" style={{ background: "#f5f5f5", color: "#4b5563", fontSize: 9.5 }}>
                      {r.cuisine}
                    </span>
                  </td>
                  <td>
                    {r.valuation ? (
                      <span className="font-display font-black text-[12.5px] text-qlub-ink">{r.valuation}</span>
                    ) : (
                      <span className="text-[11px] text-qlub-text-muted italic">—</span>
                    )}
                  </td>
                  <td>
                    {r.pos_verified ? (
                      <span className="inline-flex items-center gap-1.5 font-display font-black text-[12px] text-qlub-emerald">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {r.pos_system}
                      </span>
                    ) : r.segment === "no_modern_pos" ? (
                      <span className="inline-flex items-center gap-1.5 font-display font-bold text-[11.5px] text-qlub-text-muted italic">
                        Cash / No modern POS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-display font-bold text-[11.5px] text-qlub-text-muted italic">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        POS not detected
                      </span>
                    )}
                  </td>
                  <td>
                    {r.segment === "prospect" ? (
                      <span className="chip chip-soft" style={{ fontSize: 9.5 }}>Prospect</span>
                    ) : (
                      <span className="chip" style={{ background: "#fee2e2", color: "#b91c1c", fontSize: 9.5 }}>
                        Anti-Segment
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-qlub-text-muted">
                    No outlets match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && <DetailModal r={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function FilterCard({ label, value, onChange, options, testId }) {
  const norm = options.map((o) => (typeof o === "string" ? { v: o, l: o === "all" ? "All" : o } : o));
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
          {norm.map((o) => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-0 top-0.5 w-4 h-4 text-qlub-text-muted pointer-events-none" />
      </div>
    </div>
  );
}

function DetailModal({ r, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-qlub-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="expo-detail-modal"
    >
      <motion.div
        initial={{ scale: 0.95, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.97, y: 8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-3xl shadow-soft-lg p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-qlub-purple-50 text-qlub-text-muted hover:text-qlub-purple transition"
          data-testid="expo-detail-close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="chip chip-soft mb-3">{r.region} · {r.neighborhood}</div>
        <h2 className="font-display font-black uppercase text-4xl text-qlub-purple leading-none">{r.name}</h2>
        <div className="text-qlub-text-muted text-sm mt-1">
          {r.cuisine}
          {r.valuation && (
            <span className="ml-2 inline-flex items-center gap-1 text-qlub-emerald font-display font-black text-[12px] uppercase tracking-wider">
              · Valuation {r.valuation}
            </span>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-qlub-cream border border-qlub-line p-4">
            <div className="font-display font-black uppercase text-[10px] tracking-[0.2em] text-qlub-purple mb-1">
              POS Status
            </div>
            {r.pos_verified ? (
              <div>
                <div className="flex items-center gap-2 font-display font-black text-qlub-emerald text-lg">
                  <CheckCircle2 className="w-4 h-4" /> {r.pos_system}
                  <span className="chip chip-emerald ml-1" style={{ fontSize: 9 }}>
                    Verified · {r.pos_confidence} confidence
                  </span>
                </div>
                {r.pos_evidence_quote && (
                  <p className="mt-2 text-[12.5px] italic text-qlub-text-muted">"{r.pos_evidence_quote}"</p>
                )}
                {r.pos_evidence_url && (
                  <a
                    href={r.pos_evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-qlub-purple text-[12px] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Source
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 font-display font-bold text-qlub-text-muted italic">
                <ShieldAlert className="w-4 h-4" />
                {r.segment === "no_modern_pos" ? "Cash / No modern POS" : "POS not detected in public sources"}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-qlub-purple-50 border border-qlub-purple-100 p-4 text-[13px] text-qlub-ink leading-snug">
            <div className="font-display font-black uppercase text-[10px] tracking-[0.2em] text-qlub-purple mb-1">
              Qlub Fit
            </div>
            {r.segment === "no_modern_pos"
              ? "Not a Qlub prospect — no modern POS to integrate with. Kept visible as honest anti-segment."
              : r.pos_verified
              ? `Strong prospect. ${r.pos_system} has an open integration path — lead with ROI on close-out time.`
              : "Prospect — run an outbound conversation to verify POS before pitching integration."}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

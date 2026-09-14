import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Clock,
  UserRound,
  DollarSign,
  Zap,
  Flame,
} from "lucide-react";
import PageHeader from "../components/PageHeader";

/**
 * Marketing Insights — Revenue Recovery calculator, Pain Point Spectrum,
 * Neighborhood Specifics. Matches Google AI Studio source layout.
 */

const PAIN_SPECTRUM = [
  { icon: Clock, label: "Check Delay", intensity: 95, color: "#ef4444" },
  { icon: UserRound, label: "Staff Fatigue", intensity: 82, color: "#7d00b5" },
  { icon: DollarSign, label: "Tip Anxiety", intensity: 78, color: "#7d00b5" },
  { icon: Zap, label: "POS Crashes", intensity: 64, color: "#7d00b5" },
];

const NEIGHBORHOODS = [
  { name: "West Hollywood", intensity: 88, issue: "Staff Burnout", cost: "Highest Cost", costTone: "red" },
  { name: "Santa Monica", intensity: 75, issue: "Tourist Turnover", cost: "High Cost", costTone: "purple" },
  { name: "DTLA", intensity: 92, issue: "Lunch Rush Speed", cost: "Medium Cost", costTone: "red" },
  { name: "Silver Lake", intensity: 68, issue: "POS Fragmentation", cost: "Medium Cost", costTone: "purple" },
];

export default function MarketingInsights() {
  const [tables, setTables] = useState(25);
  const [avgCheck, setAvgCheck] = useState(85);
  const [delay, setDelay] = useState(12);

  const { annual, turnoverBump, efficiency } = useMemo(() => {
    // Napkin math: additional turns enabled by removing X-minute wait, at $ per check, across tables
    const extraTurnsPerDayPerTable = Math.max(0, (delay / 60) * 0.8);
    const dailyRevenue = tables * extraTurnsPerDayPerTable * avgCheck;
    const annualRevenue = Math.round(dailyRevenue * 330);
    const bump = Math.min(8, (delay / 30) * 5);
    const eff = Math.round(Math.min(40, (delay / 30) * 40));
    return {
      annual: annualRevenue,
      turnoverBump: +bump.toFixed(1),
      efficiency: eff,
    };
  }, [tables, avgCheck, delay]);

  return (
    <div className="space-y-8" data-testid="page-insights">
      <PageHeader
        chips={[
          <span key="a" className="chip chip-solid">Strategy Restricted</span>,
          <span key="b" className="chip chip-soft">LA Market Context</span>,
        ]}
        title="Marketing Insights"
        subtitle="Quantifying Customer Pain Points & Revenue Recovery"
      />

      {/* Revenue Recovery Calculator */}
      <section>
        <div className="section-label section-label-bar mb-3">Market Revenue Recovery</div>
        <div className="soft-card p-7 md:p-8">
          <h3 className="font-display font-bold text-2xl text-qlub-ink">Potential Recovery Calculator</h3>

          <div className="mt-6 grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <SliderField
                label="Total Tables"
                value={tables}
                onChange={setTables}
                min={10}
                max={100}
                step={1}
                ticks={[10, 25, 100]}
                testId="insights-tables"
              />
              <SliderField
                label="Avg. Check ($)"
                value={avgCheck}
                onChange={setAvgCheck}
                min={30}
                max={300}
                step={5}
                ticks={["$30", "$85", "$300"]}
                testId="insights-check"
              />
              <SliderField
                label="Check-Drop Delay (mins)"
                value={delay}
                onChange={setDelay}
                min={5}
                max={30}
                step={1}
                ticks={["5m", "12m", "30m"]}
                testId="insights-delay"
              />
            </div>

            {/* Recovery goal card */}
            <div className="col-span-12 lg:col-span-5">
              <motion.div
                key={annual}
                initial={{ opacity: 0.6, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-[#f0deff] border border-qlub-purple-200 p-7 h-full flex flex-col"
              >
                <div className="font-display font-black uppercase text-[10px] tracking-[0.22em] text-qlub-purple text-center">
                  Annual Recovery Goal
                </div>
                <div
                  className="text-center mt-3 font-display font-black text-qlub-purple leading-none"
                  style={{ fontSize: "clamp(2.6rem, 4.5vw, 3.6rem)", letterSpacing: "-0.03em" }}
                  data-testid="insights-recovery-goal"
                >
                  ${annual.toLocaleString()}
                </div>
                <p className="mt-4 text-center text-[12.5px] text-qlub-ink/75 leading-snug">
                  Recovered annual revenue by solving checkout friction at {delay} minutes per table.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-3 text-center">
                    <div className="font-display font-black text-[10px] uppercase tracking-[0.18em] text-qlub-text-muted">
                      Turnover Cap
                    </div>
                    <div className="mt-1 font-display font-black text-qlub-ink text-xl">
                      +{turnoverBump}%
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 text-center">
                    <div className="font-display font-black text-[10px] uppercase tracking-[0.18em] text-qlub-text-muted">
                      Efficiency
                    </div>
                    <div className="mt-1 font-display font-black text-qlub-emerald text-xl">
                      +{efficiency}%
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point Spectrum + Neighborhood */}
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-6">
          <div className="section-label section-label-bar mb-3">Pain Point Spectrum</div>
          <div className="soft-card p-7">
            <h3 className="font-display font-bold text-xl text-qlub-ink">Top Cited Issues</h3>
            <div className="mt-6 space-y-5">
              {PAIN_SPECTRUM.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-[13px] font-display font-bold text-qlub-ink">
                        <Icon className="w-3.5 h-3.5 text-qlub-purple" />
                        {p.label}
                      </div>
                      <div className="font-display font-black text-[12px] text-qlub-text-muted">
                        {p.intensity}% Intensity
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-qlub-line overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.intensity}%` }}
                        transition={{ duration: 0.5, delay: 0.05 * i }}
                        className="h-full rounded-full"
                        style={{ background: p.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-6">
          <div className="section-label section-label-bar mb-3">Neighborhood Specifics</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {NEIGHBORHOODS.map((n, i) => {
              const barColor = n.costTone === "red" ? "#ef4444" : "#7d00b5";
              const pillColor = n.costTone === "red" ? "#fee2e2" : "#e9d5ff";
              const pillText = n.costTone === "red" ? "#b91c1c" : "#6b009d";
              return (
                <motion.div
                  key={n.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="soft-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-display font-black text-[15px] text-qlub-ink">{n.name}</div>
                    <span
                      className="chip"
                      style={{ background: pillColor, color: pillText, fontSize: 10 }}
                    >
                      {n.intensity}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-qlub-line overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${n.intensity}%` }}
                      transition={{ duration: 0.5, delay: 0.1 + 0.05 * i }}
                      className="h-full rounded-full"
                      style={{ background: barColor }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-1.5 text-qlub-ink">
                      <Flame className="w-3 h-3 text-qlub-purple" />
                      {n.issue}
                    </div>
                    <div className="font-display font-black uppercase tracking-[0.16em] text-[10px] text-qlub-text-muted">
                      {n.cost}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, ticks, testId }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2.5">
        <div className="font-display font-black uppercase text-[10px] tracking-[0.22em] text-qlub-text-muted">
          {label}
        </div>
        <div className="font-display font-black text-qlub-purple text-[13px]">{value}</div>
      </div>
      <input
        type="range"
        className="qlub-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid={testId}
      />
      <div className="flex justify-between mt-2 text-[10.5px] font-mono text-qlub-text-muted">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { motion } from "motion/react";
import { Zap, Circle, Clock, DollarSign, Gauge, Timer } from "lucide-react";
import PageHeader from "../components/PageHeader";
import LADensityMap from "../components/LADensityMap";
import Tooltip from "../components/Tooltip";

export default function Overview({ restaurants, neighborhoods, onExport }) {
  const perf = [
    {
      kicker: "Target Velocity",
      value: "7,500",
      unit: "Tables",
      caption: "6 Month Scale Target",
      icon: Gauge,
      color: "#7d00b5",
      testId: "perf-target-velocity",
      tipTitle: "Target Velocity",
      tipBody: "Our 6-month goal — 7,500 tables paid through Qlub.",
    },
    {
      kicker: "Revenue Efficiency",
      value: "20%",
      unit: "Tip Bump",
      caption: "Network Average Impact",
      icon: DollarSign,
      color: "#7d00b5",
      testId: "perf-revenue-efficiency",
      tipTitle: "Revenue Efficiency",
      tipBody: "Guests tip about 20% more when they pay with Qlub.",
    },
    {
      kicker: "Checkout Time",
      value: "12m",
      unit: "Reduction",
      caption: "Target: -12m Impact",
      icon: Clock,
      color: "#10b981",
      testId: "perf-checkout-time",
      tipTitle: "Checkout Time",
      tipBody: "Qlub shaves 12 minutes off closing out a table.",
    },
    {
      kicker: "Checkout Friction",
      value: "-85%",
      unit: "Time Impact",
      caption: "UX Core Performance",
      icon: Timer,
      color: "#7d00b5",
      testId: "perf-checkout-friction",
      tipTitle: "Checkout Friction",
      tipBody: "Paying takes 85% less time than waiting for a check.",
    },
  ];

  return (
    <div className="space-y-10" data-testid="page-overview">
      <PageHeader
        kicker="Market Intelligence Hub"
        title="LA Market Intelligence"
      />

      {/* Hero row: quote card + market reach */}
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8">
          <div className="mb-3 section-label section-label-bar">Strategic Intelligence</div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="soft-card p-8 md:p-10"
          >
            <div className="relative pl-5 border-l-2 border-qlub-purple">
              <p className="font-display font-bold italic text-2xl md:text-3xl leading-tight text-qlub-ink">
                "Unlocking{" "}
                <span className="bg-qlub-purple-100 text-qlub-purple px-2 rounded-md not-italic font-black">
                  Ultra-Fast Market Penetration
                </span>{" "}
                by removing payment friction across the entire LA basin."
              </p>
              <p className="mt-5 text-[15px] text-qlub-text-muted leading-relaxed max-w-2xl">
                Our core objective is to replace slow, manual payment steps with our instant, app-free system.
                This allows restaurants to serve more people in less time, creating a superior experience
                for both diners and staff.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <Pillar
                icon={Zap}
                title="Elite Operations"
                body="Rapidly onboard the most popular restaurant clusters to dominate the market."
              />
              <Pillar
                icon={Circle}
                title="Brand Loyalty"
                body="Creating a faster way to pay that guests love and return for."
              />
            </div>
          </motion.div>
        </section>

        <section className="col-span-12 lg:col-span-4">
          <div className="mb-3 section-label section-label-bar">Market Reach</div>
          <Tooltip
            title="Market Reach"
            body="About 31,000 restaurants in LA we could sign up."
            placement="bottom"
            align="end"
            testId="tip-market-reach"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="soft-card-lavender p-7 h-full flex flex-col cursor-help"
              data-testid="market-reach-card"
            >
              <div className="font-display font-bold uppercase tracking-[0.22em] text-[10.5px] text-qlub-purple">
                Active<br />Restaurants
              </div>
              <div className="relative mt-6 flex items-start">
                <span
                  className="font-display font-black text-qlub-ink leading-none"
                  style={{ fontSize: "clamp(5rem, 9vw, 8rem)", letterSpacing: "-0.04em" }}
                >
                  31K
                </span>
                <span className="ml-1 mt-3 w-2.5 h-2.5 rounded-full bg-qlub-emerald animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
              </div>
              <div className="mt-auto pt-6 border-t border-qlub-purple-200">
                <div className="font-display font-bold uppercase text-[11px] tracking-[0.16em] text-qlub-ink">
                  Los Angeles Unit
                </div>
                <div className="font-display italic text-[11px] text-qlub-purple mt-0.5">
                  Real-Time Growth Sync
                </div>
              </div>
            </motion.div>
          </Tooltip>
        </section>
      </div>

      {/* Performance Index row */}
      <section>
        <div className="mb-3 section-label section-label-bar">Performance Index</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {perf.map((p, i) => {
            const Icon = p.icon;
            const isLast = i === perf.length - 1;
            return (
              <Tooltip
                key={p.kicker}
                title={p.tipTitle}
                body={p.tipBody}
                placement="top"
                align={isLast ? "end" : "center"}
                testId={`tip-${p.testId}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="soft-card p-5 cursor-help h-full"
                  data-testid={p.testId}
                >
                  <div className="flex items-center gap-2 font-display font-bold text-[10px] uppercase tracking-[0.2em] text-qlub-text-muted">
                    <Icon className="w-3.5 h-3.5" />
                    {p.kicker}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span
                      className="font-display font-black leading-none"
                      style={{ color: p.color, fontSize: "2.6rem", letterSpacing: "-0.03em" }}
                    >
                      {p.value}
                    </span>
                    <span className="font-display font-bold uppercase text-[11px] tracking-widest text-qlub-text-muted">
                      {p.unit}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-qlub-line text-[12px] text-qlub-text-muted italic">
                    {p.caption}
                  </div>
                </motion.div>
              </Tooltip>
            );
          })}
        </div>
      </section>

      {/* LA Restaurant Density */}
      <section>
        <div className="mb-3 section-label section-label-bar">LA Restaurant Density</div>
        <div className="soft-card p-0 overflow-hidden" data-testid="bento-map">
          <div className="w-full h-[560px]">
            <LADensityMap neighborhoods={neighborhoods} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Pillar({ icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl border border-qlub-line bg-qlub-cream p-5 hover:border-qlub-purple-200 transition">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-qlub-purple-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-qlub-purple" strokeWidth={2.6} />
        </div>
        <div className="font-display font-black uppercase text-[12px] tracking-[0.18em] text-qlub-ink">
          {title}
        </div>
      </div>
      <p className="mt-2.5 text-[13.5px] text-qlub-text-muted leading-snug">{body}</p>
    </div>
  );
}

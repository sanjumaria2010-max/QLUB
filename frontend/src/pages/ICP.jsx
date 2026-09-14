import React from "react";
import { motion } from "motion/react";
import {
  CreditCard,
  Gauge,
  MapPin,
  PlugZap,
  Users,
  Timer,
  XCircle,
  Scale,
} from "lucide-react";
import PageHeader from "../components/PageHeader";

// Generic, honest ICP attributes — no hard thresholds, no fake metrics.
const attributes = [
  {
    icon: CreditCard,
    title: "Modern POS In Place",
    desc: "Already running a POS — Qlub replaces the bill-pay step, not the whole system.",
  },
  {
    icon: PlugZap,
    title: "Integration-Ready",
    desc: "POS exposes an API or has a Qlub connector available. No custom middleware required.",
  },
  {
    icon: Gauge,
    title: "High-Velocity Service",
    desc: "Busy service, table turns matter, split-checks are routine.",
  },
  {
    icon: Timer,
    title: "Operational Pain At Close-Out",
    desc: "The bill-wait and check-splitting steps slow down the end of every meal.",
  },
  {
    icon: MapPin,
    title: "Prime Location",
    desc: "Visible, high-traffic neighborhood where dining is a destination, not a commodity.",
  },
  {
    icon: Users,
    title: "Guest-First Operator",
    desc: "Leadership cares about the dining experience and is willing to try a new pay flow.",
  },
];

const antiFit = [
  "QSR / counter-service only",
  "Legacy POS with no integration path",
  "Tasting-only / single-check venues",
  "Chain/franchise with centralised procurement",
  "Zero online review presence",
];

export default function ICP() {
  return (
    <div className="space-y-8" data-testid="page-icp">
      <PageHeader
        kicker="Ideal Customer Profile"
        title="Who Qlub wins with"
        subtitle="The traits we look for in a restaurant before we open a conversation."
      />

      {/* Attributes */}
      <section>
        <div className="section-label section-label-bar mb-3">Target Attributes</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {attributes.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className="soft-card p-5"
                data-testid={`icp-attr-${i}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-qlub-purple-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-qlub-purple" strokeWidth={2.4} />
                  </div>
                  <div>
                    <div className="font-display font-black text-[15px] uppercase tracking-tight text-qlub-ink leading-snug">
                      {a.title}
                    </div>
                    <p className="mt-1 text-[13px] text-qlub-text-muted leading-snug">
                      {a.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Anti-ICP */}
      <section>
        <div className="section-label section-label-bar mb-3">Anti-ICP</div>
        <div className="soft-card p-7" data-testid="icp-anti">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7">
              <div className="font-display font-black uppercase text-xl text-qlub-ink">
                Who to walk away from
              </div>
              <p className="mt-1 text-[13px] text-qlub-text-muted">
                Saying no early saves everyone time. These aren't Qlub's fight.
              </p>
              <ul className="mt-5 space-y-2.5">
                {antiFit.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-[14px]">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-qlub-ink/80">{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="rounded-2xl p-5 bg-qlub-purple-50 border border-qlub-purple-100 h-full flex flex-col">
                <div className="flex items-center gap-2 font-display font-black uppercase text-[10px] tracking-[0.2em] text-qlub-purple">
                  <Scale className="w-3.5 h-3.5" /> Positioning Line
                </div>
                <p className="mt-3 text-[15px] text-qlub-ink leading-snug italic">
                  "Qlub helps restaurants close more tables at peak by letting the guest pay the
                  second they're ready — no waiter, no wallet."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

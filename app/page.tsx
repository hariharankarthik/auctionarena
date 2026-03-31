"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Radio, Trophy, Zap } from "lucide-react";

const SOCIAL = [
  { quote: "Finally ran a clean mega auction with my office league.", who: "Ahmed · Bangalore" },
  { quote: "Realtime bids and purse math just worked.", who: "Priya · Dubai" },
  { quote: "We finished a full draft in one night.", who: "Chris · London" },
];

const STATS = [
  { label: "Live bids", value: "Realtime", icon: Radio },
  { label: "Built for", value: "IPL nights", icon: Zap },
  { label: "After the hammer", value: "Fantasy", icon: Trophy },
];

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative min-h-screen overflow-hidden bg-transparent text-neutral-100 outline-none"
    >
      <div className="aa-hero-glow" aria-hidden />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-14 px-5 py-16 sm:gap-20 sm:py-24">
        <motion.header
          {...fadeUp}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-7 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300/90 sm:text-sm">
            Your league. Your auction.
          </p>
          <h1 className="aa-display mx-auto max-w-4xl text-[1.65rem] font-bold leading-[1.15] tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
            Bid. Build.{" "}
            <span className="bg-gradient-to-r from-white via-blue-200 to-blue-500 bg-clip-text text-transparent">
              Compete.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            Feel the room react in real time — bids, purses, and the hammer. Draft squads, then chase bragging rights on
            the fantasy leaderboard.
          </p>
          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button asChild size="lg" className="h-12 min-w-[200px] text-base sm:h-12">
              <Link href="/login?next=/room/create">Start a free auction</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 min-w-[200px] text-base sm:h-12">
              <Link href="/login?next=/dashboard">I have an invite code</Link>
            </Button>
          </div>
          <div className="mx-auto grid max-w-2xl grid-cols-3 gap-3 pt-2 sm:gap-4 sm:pt-4">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-xl sm:px-4 sm:py-4"
              >
                <Icon className="mx-auto mb-2 h-4 w-4 text-blue-300/90 sm:h-5 sm:w-5" aria-hidden />
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 sm:text-xs">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-white sm:text-base">{value}</p>
              </div>
            ))}
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-4 sm:grid-cols-3 sm:gap-5"
        >
          {[
            {
              title: "Real-time bidding",
              body: "Everyone sees bids and purses update instantly — no refresh, no confusion.",
            },
            {
              title: "Fantasy league",
              body: "When the hammer stops, the season starts. Leaderboards and charts keep the rivalry alive.",
            },
            {
              title: "AI practice",
              body: "Warm up against easy, medium, or hard bots before you face your friends.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.06, duration: 0.45 }}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-colors duration-300 hover:border-blue-500/25 hover:bg-white/8 sm:p-6"
            >
              <h3 className="text-base font-semibold text-blue-200 sm:text-lg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400 group-hover:text-neutral-300">{f.body}</p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/7 to-white/3 px-5 py-10 backdrop-blur-xl sm:px-8 sm:py-12"
        >
          <h2 className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-blue-300/90 sm:text-sm">
            Why hosts love it
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-neutral-400 sm:text-base">
            Built for Friday-night drafts and group chats that go off.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {SOCIAL.map((s, i) => (
              <motion.li
                key={s.who}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-sm backdrop-blur-xl sm:p-5"
              >
                <p className="text-sm leading-relaxed text-neutral-200">&ldquo;{s.quote}&rdquo;</p>
                <p className="mt-3 text-xs font-medium text-blue-200/80">{s.who}</p>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        <p className="pb-8 text-center text-xs text-neutral-600">
          <Link href="/login" className="text-neutral-500 underline-offset-4 hover:text-blue-300 hover:underline">
            Already have an account? Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-emerald-950/30 text-neutral-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-20">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400/90">AuctionArena</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Run your own IPL mega auction with friends.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Real-time bidding, host tools, post-auction squads, and a fantasy leaderboard scaffold — built for IPL first,
            sport-agnostic later.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login?next=/room/create">Create free auction</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login?next=/dashboard">Join a room</Link>
            </Button>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="grid gap-6 sm:grid-cols-3"
        >
          {[
            { title: "Live rooms", body: "Supabase Realtime for rooms, teams, bids, and results." },
            { title: "Fantasy league", body: "Leaderboard + charts; plug in CricAPI when you are ready." },
            { title: "AI practice", body: "Offline sandbox with easy, medium, and hard bid personalities." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-5">
              <h3 className="font-semibold text-emerald-300">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-400">{f.body}</p>
            </div>
          ))}
        </motion.section>
      </div>
    </main>
  );
}

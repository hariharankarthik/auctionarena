"use client";

import type { PlayerRow } from "@/lib/sports/types";
import { formatCurrencyLakhsToCr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function PlayerCard({ player, baseLabel = "Base" }: { player: PlayerRow | null; baseLabel?: string }) {
  if (!player) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/40 p-8 text-center text-neutral-500">
        <p className="text-sm font-medium text-neutral-400">Waiting for the next player…</p>
        <p className="mt-1 text-xs text-neutral-600">The host will advance the queue when ready.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-neutral-900/95 via-neutral-950 to-neutral-950 p-6 shadow-[0_0_40px_-12px_rgba(16,185,129,0.25)] ring-1 ring-white/5 sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{player.name}</h2>
          <p className="mt-2 text-sm text-neutral-400">
            <span className="font-medium text-emerald-200/90">{player.role}</span>
            {player.nationality ? <span> · {player.nationality}</span> : null}
            {player.is_overseas ? <span className="text-amber-200/80"> · Overseas</span> : null}
          </p>
        </div>
        {player.tier ? (
          <Badge variant="secondary" className="shrink-0 border-amber-500/20 bg-amber-950/40 text-amber-200/90">
            {player.tier}
          </Badge>
        ) : null}
      </div>
      <p className="relative mt-5 text-lg font-semibold text-emerald-300 sm:text-xl">
        {baseLabel}: {formatCurrencyLakhsToCr(player.base_price)}
      </p>
      {player.stats && Object.keys(player.stats).length > 0 ? (
        <dl className="relative mt-5 grid grid-cols-2 gap-3 text-xs text-neutral-400 sm:grid-cols-3">
          {Object.entries(player.stats)
            .slice(0, 6)
            .map(([k, v]) => (
              <div key={k} className="rounded-lg bg-neutral-950/50 px-2 py-1.5 ring-1 ring-neutral-800/80">
                <dt className="uppercase tracking-wide text-neutral-500">{k}</dt>
                <dd className="mt-0.5 font-medium text-neutral-100">{String(v)}</dd>
              </div>
            ))}
        </dl>
      ) : null}
    </div>
  );
}

"use client";

import type { PlayerRow } from "@/lib/sports/types";
import { formatCurrencyLakhsToCr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function PlayerCard({ player, baseLabel = "Base" }: { player: PlayerRow | null; baseLabel?: string }) {
  if (!player) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-neutral-500">
        No player on the block
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{player.name}</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {player.role}
            {player.nationality ? ` · ${player.nationality}` : ""}
            {player.is_overseas ? " · Overseas" : ""}
          </p>
        </div>
        {player.tier ? <Badge variant="secondary">{player.tier}</Badge> : null}
      </div>
      <p className="mt-4 text-lg text-emerald-300">
        {baseLabel}: {formatCurrencyLakhsToCr(player.base_price)}
      </p>
      {player.stats && Object.keys(player.stats).length > 0 ? (
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-400 sm:grid-cols-3">
          {Object.entries(player.stats)
            .slice(0, 6)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="uppercase tracking-wide text-neutral-500">{k}</dt>
                <dd className="text-neutral-200">{String(v)}</dd>
              </div>
            ))}
        </dl>
      ) : null}
    </div>
  );
}

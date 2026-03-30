"use client";

import type { PlayerRow } from "@/lib/sports/types";
import { getSportConfig } from "@/lib/sports";

export function SquadTracker({
  sportId,
  players,
  teamLabel = "Your squad",
}: {
  sportId: string;
  players: PlayerRow[];
  teamLabel?: string;
}) {
  const cfg = getSportConfig(sportId);
  const roles = cfg?.roster.roles ?? [];
  const counts: Record<string, number> = {};
  for (const r of roles) counts[r] = 0;
  let overseas = 0;
  for (const p of players) {
    counts[p.role] = (counts[p.role] ?? 0) + 1;
    if (p.is_overseas) overseas += 1;
  }
  const maxForeign = cfg?.roster.specialRules.find((x) => x.type === "max_foreign")?.limit ?? 8;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{teamLabel}</p>
      <p className="mt-2 text-neutral-200">
        Players: {players.length}/{cfg?.roster.maxPlayers ?? 25}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-neutral-400">
        {roles.map((r) => (
          <span key={r}>
            {r}: <span className="text-neutral-100">{counts[r] ?? 0}</span>
          </span>
        ))}
      </div>
      <p className="mt-2 text-neutral-400">
        Overseas: <span className="text-neutral-100">{overseas}</span> / {maxForeign}
      </p>
    </div>
  );
}

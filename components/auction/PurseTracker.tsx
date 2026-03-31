"use client";

import type { AuctionTeam } from "@/lib/sports/types";
import { getSportConfig } from "@/lib/sports";
import { formatCurrencyLakhsToCr } from "@/lib/utils";

export function PurseTracker({ teams, sportId }: { teams: AuctionTeam[]; sportId: string }) {
  const cfg = getSportConfig(sportId);
  const defaultPurse = cfg?.purse.default ?? 12000;
  const symbol = cfg?.currency.symbol ?? "₹";

  return (
    <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Purse tracker</p>
      <ul className="space-y-2 text-sm">
        {teams.map((t) => {
          const pct = Math.min(100, Math.round((t.remaining_purse / defaultPurse) * 100));
          return (
            <li key={t.id}>
              <div className="mb-1 flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.team_color }} />
                  {t.team_name}
                </span>
                <span className="text-neutral-200">{formatCurrencyLakhsToCr(t.remaining_purse, symbol)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
              <div className="h-full rounded-full bg-blue-600/80" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

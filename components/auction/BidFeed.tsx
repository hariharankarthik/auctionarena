"use client";

import type { AuctionTeam, BidRow } from "@/lib/sports/types";
import { formatCurrencyLakhsToCr } from "@/lib/utils";

export function BidFeed({ bids, teams }: { bids: BidRow[]; teams: AuctionTeam[] }) {
  const nameById = new Map(teams.map((t) => [t.id, t.team_name]));

  return (
    <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Bid feed</p>
      {bids.length === 0 ? (
        <p className="text-sm text-neutral-500">No bids yet</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {bids.map((b) => (
            <li key={b.id} className="flex justify-between gap-2 border-b border-neutral-900 pb-2 last:border-0">
              <span className="text-neutral-400">
                {new Date(b.created_at).toLocaleTimeString()} · {nameById.get(b.team_id) ?? "Team"}
              </span>
              <span className="font-medium text-blue-200">{formatCurrencyLakhsToCr(b.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

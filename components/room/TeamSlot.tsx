"use client";

import type { AuctionTeam } from "@/lib/sports/types";

export function TeamSlot({ team }: { team: AuctionTeam }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.team_color }} />
        <span className="font-medium text-neutral-100">{team.team_name}</span>
      </div>
      <span className={team.is_ready ? "text-emerald-400" : "text-neutral-500"}>
        {team.is_ready ? "Ready" : "Not ready"}
      </span>
    </div>
  );
}

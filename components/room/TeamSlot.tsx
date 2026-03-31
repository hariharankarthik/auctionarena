"use client";

import type { AuctionTeam } from "@/lib/sports/types";
import { Check } from "lucide-react";

export function TeamSlot({ team }: { team: AuctionTeam }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
        team.is_ready
          ? "border-blue-500/35 bg-blue-950/20 shadow-[0_0_20px_-8px_rgba(59,130,246,0.28)]"
          : "border-neutral-800 bg-neutral-950/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/10"
          style={{ backgroundColor: team.team_color }}
        />
        <span className="font-medium text-neutral-100">{team.team_name}</span>
      </div>
      <span
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${
          team.is_ready ? "text-blue-300" : "text-neutral-500"
        }`}
      >
        {team.is_ready ? (
          <>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20">
              <Check className="h-3 w-3 text-blue-200" aria-hidden />
            </span>
            Ready
          </>
        ) : (
          "Waiting"
        )}
      </span>
    </div>
  );
}

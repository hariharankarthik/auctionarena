"use client";

import { useState, useMemo } from "react";
import { PlayerMeta } from "@/components/player/PlayerMeta";

export interface FreeAgent {
  id: string;
  name: string;
  role: string;
  nationality: string | null;
  is_overseas: boolean;
  base_price: number;
}

const ROLE_ORDER: Record<string, number> = { WK: 0, BAT: 1, ALL: 2, BOWL: 3 };
const ROLE_FILTERS = ["All", "WK", "BAT", "ALL", "BOWL"] as const;

export function FreeAgentsList({ players }: { players: FreeAgent[] }) {
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter((p) => (roleFilter === "All" || p.role === roleFilter) && (!q || p.name.toLowerCase().includes(q)))
      .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || b.base_price - a.base_price);
  }, [players, roleFilter, search]);

  if (players.length === 0) {
    return <p className="py-3 text-sm text-neutral-500">Every player in the pool has been picked.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search by name…"
          aria-label="Search free agents by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-48 rounded-lg border border-white/10 bg-neutral-950/50 px-3 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-violet-500/40 focus:outline-none"
        />
        <div className="flex gap-1" role="radiogroup" aria-label="Filter by role">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              role="radio"
              aria-checked={roleFilter === r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                roleFilter === r
                  ? "bg-violet-600/25 text-violet-200 ring-1 ring-violet-500/30"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
              }`}
            >
              {r === "All" ? "All" : r}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-neutral-500">
          {filtered.length} player{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Player list */}
      {filtered.length === 0 ? (
        <p className="py-2 text-sm text-neutral-500">No players match your filters.</p>
      ) : (
        <div className="grid gap-1.5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-neutral-950/35 px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <PlayerMeta variant="inline" role={p.role} nationality={p.nationality} isOverseas={p.is_overseas} className="shrink-0" />
                <span className="truncate text-neutral-100">{p.name}</span>
              </div>
              <span className="shrink-0 text-xs text-neutral-500">₹{p.base_price}L</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

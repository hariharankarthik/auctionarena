"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ResultPlayer } from "./ResultsBody";

const MAX = 11;

export function LineupPanel({
  teamId,
  ownerId,
  myUserId,
  players,
  initialXi,
  captainPlayerId,
  viceCaptainPlayerId,
}: {
  teamId: string;
  ownerId: string;
  myUserId: string;
  players: ResultPlayer[];
  initialXi: string[];
  captainPlayerId: string | null;
  viceCaptainPlayerId: string | null;
}) {
  const isOwner = myUserId === ownerId;
  const [xi, setXi] = useState<Set<string>>(() => new Set(initialXi));
  const [c, setC] = useState<string | null>(captainPlayerId);
  const [vc, setVc] = useState<string | null>(viceCaptainPlayerId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setXi(new Set(initialXi));
    setC(captainPlayerId);
    setVc(viceCaptainPlayerId);
  }, [teamId, captainPlayerId, viceCaptainPlayerId, initialXi]);

  const squadIds = useMemo(() => new Set(players.map((p) => p.playerId)), [players]);

  if (!isOwner) return null;

  function setCaptain(pid: string) {
    setC(pid);
    if (vc === pid) setVc(null);
  }

  function setViceCaptain(pid: string) {
    setVc(pid);
    if (c === pid) setC(null);
  }

  function toggle(pid: string) {
    setXi((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
        if (c === pid) setC(null);
        if (vc === pid) setVc(null);
      } else {
        if (next.size >= MAX) {
          toast.error(`At most ${MAX} starters`);
          return prev;
        }
        next.add(pid);
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/team/lineup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          starting_xi_player_ids: [...xi],
          captain_player_id: c,
          vice_captain_player_id: vc,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Lineup saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-neutral-950/60">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800/80 p-4">
        <div>
          <p className="text-sm font-semibold text-white">Starting XI</p>
          <p className="mt-1 text-xs text-neutral-400">
            Choose up to {MAX}. Starters count for points; bench scores 0. Captain 2× · Vice-captain 1.5×.
          </p>
        </div>
        <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/20">
          {xi.size}/{MAX} selected
        </div>
      </div>

      <ul className="max-h-72 space-y-2 overflow-y-auto p-4">
        {players.map((p) => {
          const on = xi.has(p.playerId);
          const isC = c === p.playerId;
          const isVC = vc === p.playerId;
          return (
            <li
              key={p.playerId}
              className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                on
                  ? "border-emerald-500/25 bg-emerald-950/20"
                  : "border-neutral-800 bg-neutral-950/40"
              }`}
            >
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(p.playerId)}
                  className="h-4 w-4 rounded border-neutral-600 text-emerald-500"
                />
                <span>
                  <span className="font-medium text-neutral-100">{p.name}</span>{" "}
                  <span className="text-neutral-500">· {p.role}</span>
                </span>
              </label>
              {on ? (
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCaptain(p.playerId)}
                    className={`rounded-full px-2 py-1 font-semibold ring-1 transition-colors ${
                      isC
                        ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                        : "bg-neutral-900/40 text-neutral-400 ring-neutral-700/80 hover:text-neutral-200"
                    }`}
                    title={isVC ? "Captain and vice-captain must be different" : "Set as captain"}
                  >
                    C · 2×
                  </button>
                  <button
                    type="button"
                    onClick={() => setViceCaptain(p.playerId)}
                    className={`rounded-full px-2 py-1 font-semibold ring-1 transition-colors ${
                      isVC
                        ? "bg-sky-500/15 text-sky-200 ring-sky-500/30"
                        : "bg-neutral-900/40 text-neutral-400 ring-neutral-700/80 hover:text-neutral-200"
                    }`}
                    title={isC ? "Captain and vice-captain must be different" : "Set as vice-captain"}
                  >
                    VC · 1.5×
                  </button>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-800/80 p-4">
        <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save lineup"}
        </Button>
        <span className="text-xs text-neutral-500">Squad size {squadIds.size}</span>
        {c && vc ? (
          <span className="ml-auto text-xs text-neutral-500">
            Saved as: <span className="text-emerald-200">C</span> + <span className="text-sky-200">VC</span>
          </span>
        ) : (
          <span className="ml-auto text-xs text-neutral-600">Pick C and VC from your starters (optional).</span>
        )}
      </div>
    </div>
  );
}

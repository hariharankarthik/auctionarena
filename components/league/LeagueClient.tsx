"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { AuctionTeam } from "@/lib/sports/types";
import { Leaderboard } from "./Leaderboard";
import { MatchBreakdown } from "./MatchBreakdown";
import { PointsChart } from "./PointsChart";
import { Button } from "@/components/ui/button";

export function LeagueClient({
  leagueId,
  isHost,
  teams,
}: {
  roomId: string;
  leagueId: string | null;
  isHost: boolean;
  teams: AuctionTeam[];
}) {
  const { scores, loading } = useLeaderboard(leagueId);
  const [busy, setBusy] = useState(false);

  async function mockMatch() {
    if (!leagueId) return;
    setBusy(true);
    try {
      const matchId = `M${Date.now()}`;
      const res = await fetch("/api/scores/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league_id: leagueId,
          match_id: matchId,
          match_date: new Date().toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`Recorded ${data.updated} team rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!leagueId) {
    return (
      <p className="text-sm text-neutral-500">
        Fantasy league unlocks when the auction completes. Finish all lots, then open this page again.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {isHost ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void mockMatch()}>
            Host: add mock match scores
          </Button>
          <span className="text-xs text-neutral-500 self-center">MVP placeholder until CricAPI wiring.</span>
        </div>
      ) : null}
      {loading ? <p className="text-sm text-neutral-500">Loading scores…</p> : null}
      <Leaderboard scores={scores} teams={teams} />
      <PointsChart scores={scores} teams={teams} />
      <MatchBreakdown scores={scores} teams={teams} />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ScoreRow = {
  id: string;
  league_id: string;
  team_id: string | null;
  private_team_id: string | null;
  /** Use for aggregation / charts (auction team id or private team id) */
  scoreboard_team_id: string;
  match_id: string;
  match_date: string;
  total_points: number;
  breakdown: Record<string, unknown>;
};

export function useLeaderboard(leagueId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [matchNames, setMatchNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) {
      setScores([]);
      setMatchNames({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const { data } = await supabase.from("fantasy_scores").select("*").eq("league_id", leagueId);
      if (cancelled) return;
      const raw = (data ?? []) as Array<{
        id: string;
        league_id: string;
        team_id: string | null;
        private_team_id: string | null;
        match_id: string;
        match_date: string;
        total_points: number;
        breakdown: Record<string, unknown>;
      }>;
      const rows = raw.map((r) => ({
        ...r,
        scoreboard_team_id: (r.team_id ?? r.private_team_id) as string,
      }));
      setScores(rows);

      // Fetch human-readable match names from cricket_sync_tracker via RPC
      const matchIds = [...new Set(rows.map((r) => r.match_id))];
      if (matchIds.length > 0) {
        const { data: nameRows } = await supabase.rpc("get_match_display_names", {
          p_match_ids: matchIds,
        });
        if (!cancelled && Array.isArray(nameRows)) {
          const names: Record<string, string> = {};
          for (const r of nameRows as { match_id: string; display_name: string }[]) {
            names[r.match_id] = r.display_name;
          }
          setMatchNames(names);
        }
      }

      setLoading(false);
    }

    void load();

    const channel = supabase
      .channel(`scores:${leagueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fantasy_scores", filter: `league_id=eq.${leagueId}` },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [leagueId, supabase]);

  return { scores, matchNames, loading };
}

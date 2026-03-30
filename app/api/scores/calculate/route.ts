import { createClient } from "@/lib/supabase/server";
import { getSportConfig } from "@/lib/sports";
import { NextRequest, NextResponse } from "next/server";

/**
 * MVP: deterministic mock points per team for a match_id. Host-only.
 * Replace with CricAPI-backed stats when keys are configured.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { league_id, match_id, match_date } = await req.json();
  if (!league_id || !match_id || !match_date) {
    return NextResponse.json({ error: "league_id, match_id, match_date required" }, { status: 400 });
  }

  const { data: league, error: lErr } = await supabase
    .from("fantasy_leagues")
    .select("id, room_id, sport_id")
    .eq("id", league_id)
    .single();

  if (lErr || !league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const { data: room } = await supabase.from("auction_rooms").select("host_id").eq("id", league.room_id).single();
  if (!room || room.host_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: teams } = await supabase.from("auction_teams").select("id").eq("room_id", league.room_id);

  const scoring = getSportConfig(league.sport_id)?.scoring ?? [];
  const playingXi = scoring.find((s) => s.action === "playing_xi");

  const rows = (teams ?? []).map((t, i) => {
    const base = 20 + (i + 1) * 3 + (match_id.length % 7);
    const breakdown = {
      mock: base,
      playing_xi: playingXi?.points ?? 0,
    };
    const total = base + (playingXi?.points ?? 0);
    return {
      league_id,
      team_id: t.id,
      match_id: String(match_id),
      match_date,
      total_points: total,
      breakdown,
    };
  });

  const { error } = await supabase.from("fantasy_scores").upsert(rows, {
    onConflict: "league_id,team_id,match_id",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, updated: rows.length });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_SQUAD_SIZE = 15;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    league_id?: string;
    player_id?: string;
  };

  const { league_id, player_id } = body;
  if (!league_id || !player_id) {
    return NextResponse.json({ error: "league_id and player_id are required" }, { status: 400 });
  }

  // Verify league is active
  const { data: league } = await supabase
    .from("fantasy_leagues")
    .select("id, status, league_kind")
    .eq("id", league_id)
    .single();
  if (!league || league.league_kind !== "private") {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }
  if (league.status !== "active") {
    return NextResponse.json({ error: "Adding players is only allowed in active leagues" }, { status: 400 });
  }

  // Get my team
  const { data: myTeam } = await supabase
    .from("private_league_teams")
    .select("id, squad_player_ids, claimed_by")
    .eq("league_id", league_id)
    .eq("claimed_by", user.id)
    .single();
  if (!myTeam) {
    return NextResponse.json({ error: "You don't have a team in this league" }, { status: 403 });
  }

  const mySquad = (myTeam.squad_player_ids as string[]) ?? [];
  if (mySquad.length >= MAX_SQUAD_SIZE) {
    return NextResponse.json({ error: `Squad is already at maximum size (${MAX_SQUAD_SIZE})` }, { status: 400 });
  }

  if (mySquad.includes(player_id)) {
    return NextResponse.json({ error: "Player is already on your squad" }, { status: 400 });
  }

  // Verify player is not on any team in this league
  const { data: allTeams } = await supabase
    .from("private_league_teams")
    .select("squad_player_ids")
    .eq("league_id", league_id);
  const allPicked = new Set((allTeams ?? []).flatMap((t) => (t.squad_player_ids as string[]) ?? []));
  if (allPicked.has(player_id)) {
    return NextResponse.json({ error: "This player is already on a team" }, { status: 400 });
  }

  // Verify player exists
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("id", player_id)
    .single();
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Add player to squad
  const newSquad = [...mySquad, player_id];
  const { error: updateErr } = await supabase
    .from("private_league_teams")
    .update({ squad_player_ids: newSquad })
    .eq("id", myTeam.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

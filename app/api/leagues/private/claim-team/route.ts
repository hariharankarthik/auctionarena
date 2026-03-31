import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { league_id?: string; team_id?: string };
  const league_id = body.league_id?.trim();
  const team_id = body.team_id?.trim();
  if (!league_id || !team_id) {
    return NextResponse.json({ error: "league_id and team_id required" }, { status: 400 });
  }

  const { data: league, error: lErr } = await supabase
    .from("fantasy_leagues")
    .select("id, host_id, sport_id, league_kind")
    .eq("id", league_id)
    .single();
  if (lErr || !league) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.league_kind !== "private") {
    return NextResponse.json({ error: "Only private leagues support claiming teams" }, { status: 400 });
  }

  const { data: existingClaim } = await supabase
    .from("private_league_teams")
    .select("id")
    .eq("league_id", league_id)
    .eq("claimed_by", user.id)
    .maybeSingle();
  if (existingClaim) {
    return NextResponse.json({ error: "You already claimed a team in this league" }, { status: 400 });
  }

  const { data: team, error: tErr } = await supabase
    .from("private_league_teams")
    .select("id, league_id, claimed_by")
    .eq("id", team_id)
    .eq("league_id", league_id)
    .single();
  if (tErr || !team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.claimed_by) {
    return NextResponse.json({ error: "This team is already claimed" }, { status: 400 });
  }

  // Claim: only succeed if still unclaimed.
  const { error: uErr } = await supabase
    .from("private_league_teams")
    .update({ claimed_by: user.id })
    .eq("id", team_id)
    .is("claimed_by", null);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}


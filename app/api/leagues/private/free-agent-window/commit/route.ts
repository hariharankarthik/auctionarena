import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    league_id?: string;
    changes?: { drop: string | null; add: string | null }[];
  };

  const { league_id, changes } = body;
  if (!league_id || !Array.isArray(changes) || changes.length === 0) {
    return NextResponse.json({ error: "league_id and non-empty changes array required" }, { status: 400 });
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
    return NextResponse.json({ error: "Free agent window is only available in active leagues" }, { status: 400 });
  }

  // Get my team
  const { data: myTeam } = await supabase
    .from("private_league_teams")
    .select("id")
    .eq("league_id", league_id)
    .eq("claimed_by", user.id)
    .single();
  if (!myTeam) {
    return NextResponse.json({ error: "You don't have a team in this league" }, { status: 403 });
  }

  // Build the swaps JSONB array
  const swaps = changes.map((c) => ({
    drop: c.drop ?? null,
    add: c.add ?? null,
  }));

  const { data: result, error: rpcErr } = await supabase.rpc("commit_free_agent_window", {
    p_team_id: myTeam.id,
    p_league_id: league_id,
    p_user_id: user.id,
    p_swaps: swaps,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  const rpcResult = result as { error?: string; success?: boolean; squad_size?: number };
  if (rpcResult?.error) {
    return NextResponse.json({ error: rpcResult.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, squad_size: rpcResult?.squad_size ?? null });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { team_id, is_ready } = await req.json();
  if (!team_id || typeof is_ready !== "boolean") {
    return NextResponse.json({ error: "team_id and is_ready required" }, { status: 400 });
  }

  const { data: team, error } = await supabase.from("auction_teams").select("*").eq("id", team_id).single();
  if (error || !team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (team.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error: uErr } = await supabase.from("auction_teams").update({ is_ready }).eq("id", team_id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invite_code, team_name, team_color } = await req.json();
  if (!invite_code || !team_name?.trim()) {
    return NextResponse.json({ error: "invite_code and team_name required" }, { status: 400 });
  }

  const { data: room, error: rErr } = await supabase
    .from("auction_rooms")
    .select("*")
    .eq("invite_code", String(invite_code).trim().toUpperCase())
    .single();

  if (rErr || !room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "Room is not accepting joins" }, { status: 400 });
  }

  const config = room.config as { purse?: number; maxTeams?: number };
  const purse = typeof config.purse === "number" ? config.purse : 12000;

  const { count, error: cErr } = await supabase
    .from("auction_teams")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  const maxTeams = typeof config.maxTeams === "number" ? config.maxTeams : 10;
  if ((count ?? 0) >= maxTeams) {
    return NextResponse.json({ error: "Room is full" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("auction_teams")
    .select("id")
    .eq("room_id", room.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ room_id: room.id, team_id: existing.id, already_member: true });
  }

  const { data: team, error: tErr } = await supabase
    .from("auction_teams")
    .insert({
      room_id: room.id,
      owner_id: user.id,
      team_name: team_name.trim(),
      team_color: team_color || "#3B82F6",
      remaining_purse: purse,
    })
    .select("id")
    .single();

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
  return NextResponse.json({ room_id: room.id, team_id: team.id });
}

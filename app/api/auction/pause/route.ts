import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { room_id, paused } = await req.json();
  if (!room_id || typeof paused !== "boolean") {
    return NextResponse.json({ error: "room_id and paused required" }, { status: 400 });
  }

  const { data: room, error } = await supabase.from("auction_rooms").select("*").eq("id", room_id).single();
  if (error || !room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (room.host_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = paused ? "paused" : "live";
  const { error: uErr } = await supabase.from("auction_rooms").update({ status }).eq("id", room_id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
  return NextResponse.json({ success: true, status });
}

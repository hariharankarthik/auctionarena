import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { room_id } = await req.json();
  if (!room_id) return NextResponse.json({ error: "room_id required" }, { status: 400 });

  const { data: room, error } = await supabase.from("auction_rooms").select("*").eq("id", room_id).single();
  if (error || !room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (room.host_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (room.status !== "lobby" && room.status !== "paused") {
    return NextResponse.json({ error: "Auction already started or completed" }, { status: 400 });
  }

  // Resume mid-auction: keep current player, bid, and bidder (all persisted in auction_rooms).
  if (room.status === "paused") {
    const { error: upErr } = await supabase.from("auction_rooms").update({ status: "live" }).eq("id", room_id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    return NextResponse.json({ success: true, resumed: true });
  }

  const queue = room.player_queue ?? [];
  if (!queue.length) return NextResponse.json({ error: "Empty player queue" }, { status: 400 });

  const idx = room.queue_index ?? 0;
  const playerId = queue[idx];
  if (!playerId) return NextResponse.json({ error: "Invalid queue index" }, { status: 400 });

  const { data: player } = await supabase.from("players").select("base_price").eq("id", playerId).single();

  const { error: upErr } = await supabase
    .from("auction_rooms")
    .update({
      status: "live",
      current_player_id: playerId,
      current_bid: player?.base_price ?? 0,
      current_bidder_team_id: null,
    })
    .eq("id", room_id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

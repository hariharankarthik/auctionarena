import { createClient } from "@/lib/supabase/server";
import { advanceLotAfterResult } from "@/lib/room-advance";
import { NextRequest, NextResponse } from "next/server";

/**
 * Host-only: advance to next player without recording a result (abandon current lot).
 * Use when the queue should move on without a sold/unsold row — prefer /unsold for official record.
 */
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

  const { completed } = await advanceLotAfterResult(supabase, room_id, room);
  return NextResponse.json({ success: true, completed });
}

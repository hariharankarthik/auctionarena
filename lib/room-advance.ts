import type { SupabaseClient } from "@supabase/supabase-js";

type RoomRow = {
  sport_id: string;
  queue_index: number;
  player_queue: string[];
};

export async function advanceLotAfterResult(
  supabase: SupabaseClient,
  roomId: string,
  room: RoomRow,
): Promise<{ completed: boolean }> {
  const nextIndex = room.queue_index + 1;
  if (nextIndex >= room.player_queue.length) {
    await supabase
      .from("auction_rooms")
      .update({
        status: "completed",
        current_player_id: null,
        current_bidder_team_id: null,
      })
      .eq("id", roomId);

    await supabase.from("fantasy_leagues").upsert(
      {
        room_id: roomId,
        sport_id: room.sport_id,
        status: "active",
      },
      { onConflict: "room_id" },
    );

    return { completed: true };
  }

  const nextPlayerId = room.player_queue[nextIndex]!;
  const { data: nextPlayer } = await supabase
    .from("players")
    .select("base_price")
    .eq("id", nextPlayerId)
    .single();

  await supabase
    .from("auction_rooms")
    .update({
      current_player_id: nextPlayerId,
      current_bid: nextPlayer?.base_price ?? 0,
      current_bidder_team_id: null,
      queue_index: nextIndex,
    })
    .eq("id", roomId);

  return { completed: false };
}

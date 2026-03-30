import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginUrlWithNext } from "@/lib/safe-path";
import { AuctionRoomView } from "@/components/auction/AuctionRoomView";

export default async function AuctionPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginUrlWithNext(`/room/${roomId}/auction`));

  const { data: room, error } = await supabase.from("auction_rooms").select("id").eq("id", roomId).single();
  if (error || !room) notFound();

  const { data: myTeam } = await supabase
    .from("auction_teams")
    .select("id")
    .eq("room_id", roomId)
    .eq("owner_id", user.id)
    .maybeSingle();

  return <AuctionRoomView roomId={roomId} userId={user.id} myTeamId={myTeam?.id ?? null} />;
}

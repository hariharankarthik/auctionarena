import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LobbyView } from "@/components/room/LobbyView";

export default async function LobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room, error } = await supabase.from("auction_rooms").select("*").eq("id", roomId).single();
  if (error || !room) notFound();

  const { data: myTeam } = await supabase
    .from("auction_teams")
    .select("id")
    .eq("room_id", roomId)
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <LobbyView
      roomId={roomId}
      isHost={room.host_id === user.id}
      myTeamId={myTeam?.id ?? null}
      inviteCode={room.invite_code}
    />
  );
}

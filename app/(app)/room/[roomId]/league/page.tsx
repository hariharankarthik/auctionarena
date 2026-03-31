import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueClient } from "@/components/league/LeagueClient";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default async function LeaguePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: room, error } = await supabase.from("auction_rooms").select("*").eq("id", roomId).single();
  if (error || !room) notFound();

  const { data: league } = await supabase.from("fantasy_leagues").select("*").eq("room_id", roomId).maybeSingle();

  const { data: teams } = await supabase.from("auction_teams").select("*").eq("room_id", roomId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title={room.name}
        subtitle="Fantasy league"
        actions={
          <Button asChild variant="secondary">
            <Link href={`/room/${roomId}/results`}>Results</Link>
          </Button>
        }
      />
      <LeagueClient
        leagueId={league?.id ?? null}
        isHost={user?.id === room.host_id}
        teams={(teams ?? []).map((t) => ({
          id: t.id,
          team_name: t.team_name,
          team_color: t.team_color,
        }))}
      />
    </div>
  );
}

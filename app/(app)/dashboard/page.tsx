import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RoomCard } from "@/components/room/RoomCard";
import { JoinModal } from "@/components/room/JoinModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuctionRoom } from "@/lib/sports/types";
import { IPL_2026 } from "@/lib/sports/ipl";
import { NFL_2026 } from "@/lib/sports/nfl";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: hosted } = await supabase.from("auction_rooms").select("*").eq("host_id", user.id);

  const { data: memberships } = await supabase
    .from("auction_teams")
    .select("room_id, auction_rooms (*)")
    .eq("owner_id", user.id);

  const memberRooms = (memberships ?? [])
    .map((m) => m.auction_rooms as unknown as AuctionRoom | null)
    .filter(Boolean) as AuctionRoom[];

  const hostedRooms = (hosted ?? []) as AuctionRoom[];
  const byId = new Map<string, { room: AuctionRoom; role: "host" | "member" }>();
  for (const r of hostedRooms) byId.set(r.id, { room: r, role: "host" });
  for (const r of memberRooms) {
    if (!byId.has(r.id)) byId.set(r.id, { room: r, role: "member" });
  }

  const roomRows = [...byId.values()];

  const countResults = await Promise.all(
    roomRows.map(async ({ room }) => {
      const { count } = await supabase
        .from("auction_teams")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id);
      return [room.id, count ?? 0] as const;
    }),
  );
  const counts = Object.fromEntries(countResults) as Record<string, number>;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-neutral-500">Active sports, your rooms, and quick actions.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">Active sports</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-emerald-900/40 bg-emerald-950/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {IPL_2026.displayName}
                <Badge>LIVE</Badge>
              </CardTitle>
              <CardDescription>Cricket · IPL auction + fantasy</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-neutral-800 opacity-60">
            <CardHeader>
              <CardTitle className="text-base">{NFL_2026.displayName}</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/room/create">Create room</Link>
        </Button>
        <JoinModal />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">My rooms</h2>
        {roomRows.length === 0 ? (
          <p className="text-sm text-neutral-500">No rooms yet — create one or join with a code.</p>
        ) : (
          <div className="grid gap-3">
            {roomRows.map(({ room, role }) => (
              <RoomCard key={room.id} room={room} teamsCount={counts[room.id] ?? 0} role={role} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

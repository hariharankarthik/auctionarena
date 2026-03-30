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
import { PlusCircle, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "there";

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
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-neutral-950/60 to-amber-950/10 p-6 sm:p-8">
        <p className="text-sm font-medium text-emerald-400/90">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{displayName}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          Spin up a room in seconds, share a code, and run a proper mega auction — then keep the energy going with
          fantasy points.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg" className="h-11 gap-2 sm:min-w-[200px]">
            <Link href="/room/create">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Create room
            </Link>
          </Button>
          <div className="flex h-11 items-center justify-center sm:justify-start">
            <JoinModal />
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Seasons</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="overflow-hidden border-emerald-500/25 bg-gradient-to-b from-emerald-950/35 to-neutral-950/80 shadow-lg shadow-emerald-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                {IPL_2026.displayName}
                <Badge className="border-0 bg-emerald-500/20 text-emerald-200">Live</Badge>
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Cricket · mega auction + post-draft fantasy
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-neutral-500">Full player pool seeded — ready when you are.</CardContent>
          </Card>
          <Card className="border-neutral-800/90 bg-neutral-950/50 opacity-70">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-neutral-400">{NFL_2026.displayName}</CardTitle>
              <CardDescription>On the roadmap</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-neutral-600">Same engine, different sport — next phase.</CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-neutral-500" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Your rooms</h2>
        </div>
        {roomRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-neutral-300">No rooms yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Create one for your group or paste an invite code from your host.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/room/create">Create your first room</Link>
              </Button>
              <JoinModal />
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {roomRows.map(({ room, role }) => (
              <RoomCard key={room.id} room={room} teamsCount={counts[room.id] ?? 0} role={role} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

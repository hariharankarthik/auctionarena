import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrencyLakhsToCr } from "@/lib/utils";

export default async function ResultsPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();

  const { data: room, error } = await supabase.from("auction_rooms").select("*").eq("id", roomId).single();
  if (error || !room) notFound();

  const { data: teams } = await supabase.from("auction_teams").select("*").eq("room_id", roomId);
  const { data: results } = await supabase.from("auction_results").select("*").eq("room_id", roomId);
  const playerIds = [...new Set((results ?? []).map((r) => r.player_id))];
  const { data: players } =
    playerIds.length > 0
      ? await supabase.from("players").select("*").in("id", playerIds)
      : { data: [] as { id: string; name: string; role: string; is_overseas: boolean }[] };

  const playerById = new Map((players ?? []).map((p) => [p.id, p]));
  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));

  const byTeam = new Map<string, typeof results>();
  for (const r of results ?? []) {
    if (!r.team_id || r.is_unsold) continue;
    const list = byTeam.get(r.team_id) ?? [];
    list.push(r);
    byTeam.set(r.team_id, list);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{room.name}</h1>
          <p className="text-sm text-neutral-500">Auction results</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/room/${roomId}/league`}>Fantasy league</Link>
        </Button>
      </div>
      {(teams ?? []).map((team) => {
        const rows = byTeam.get(team.id) ?? [];
        const spend = rows.reduce((s, r) => s + (r.sold_price ?? 0), 0);
        const avg = rows.length ? spend / rows.length : 0;
        return (
          <Card key={team.id} className="border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.team_color }} />
                {team.team_name}
              </CardTitle>
              <p className="text-sm text-neutral-500">
                Spend {formatCurrencyLakhsToCr(spend)} · Avg {formatCurrencyLakhsToCr(Math.round(avg))} · Players{" "}
                {rows.length}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {rows.map((r) => {
                  const p = playerById.get(r.player_id);
                  return (
                    <li key={r.id} className="rounded-lg border border-neutral-800 px-3 py-2 text-sm">
                      <span className="font-medium">{p?.name ?? r.player_id}</span>
                      <span className="text-neutral-500"> · {p?.role}</span>
                      <div className="text-emerald-300">{formatCurrencyLakhsToCr(r.sold_price ?? 0)}</div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}
      <Button asChild variant="secondary">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

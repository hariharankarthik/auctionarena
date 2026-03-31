import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueClient } from "@/components/league/LeagueClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeagueTeamDisplay } from "@/lib/sports/types";

export default async function PrivateLeaguePage({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: league, error } = await supabase
    .from("fantasy_leagues")
    .select("id, name, host_id, league_kind, invite_code")
    .eq("id", leagueId)
    .single();

  if (error || !league || league.league_kind !== "private") notFound();

  const { data: privateTeams } = await supabase
    .from("private_league_teams")
    .select("id, team_name, team_color, squad_player_ids, captain_player_id, vice_captain_player_id")
    .eq("league_id", leagueId);

  const teams: LeagueTeamDisplay[] = (privateTeams ?? []).map((t) => ({
    id: t.id,
    team_name: t.team_name,
    team_color: t.team_color,
  }));

  const isHost = user?.id === league.host_id;

  const playerIds = [...new Set((privateTeams ?? []).flatMap((t) => (t.squad_player_ids as string[]) ?? []))];
  const { data: playerRows } = playerIds.length
    ? await supabase.from("players").select("id, name, role, nationality, is_overseas").in("id", playerIds)
    : { data: [] as { id: string; name: string; role: string; nationality: string | null; is_overseas: boolean }[] };
  const playersById = new Map((playerRows ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="aa-display text-2xl font-semibold text-white">{league.name}</h1>
          <p className="text-sm text-neutral-500">
            Private league · invite code <span className="aa-invite-code text-violet-300">{league.invite_code}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isHost ? (
            <Button asChild variant="secondary" className="border-violet-500/30 text-violet-200">
              <Link href={`/league/private/${leagueId}/import`}>Import rosters</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
      {teams.length === 0 ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
          {isHost ? (
            <>
              No teams yet.{" "}
              <Link href={`/league/private/${leagueId}/import`} className="font-medium text-violet-300 underline underline-offset-2">
                Import a sheet
              </Link>{" "}
              to add squads.
            </>
          ) : (
            "The host hasn’t imported teams yet — check back soon."
          )}
        </div>
      ) : null}

      {privateTeams && privateTeams.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Rosters</h2>
            <span className="text-xs text-neutral-600">{privateTeams.length} teams</span>
          </div>
          <div className="grid gap-3">
            {privateTeams.map((t) => {
              const squad = ((t.squad_player_ids as string[]) ?? [])
                .map((id) => playersById.get(id))
                .filter(Boolean) as { id: string; name: string; role: string; nationality: string | null; is_overseas: boolean }[];
              const overseas = squad.filter((p) => p.is_overseas).length;
              const cId = t.captain_player_id as string | null;
              const vcId = t.vice_captain_player_id as string | null;

              return (
                <details
                  key={t.id}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl open:border-blue-500/25"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white/10"
                        style={{ backgroundColor: t.team_color ?? "#3B82F6" }}
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium text-white">{t.team_name}</p>
                        <p className="text-xs text-neutral-500">
                          {squad.length} players · {overseas} overseas
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500 group-open:text-neutral-300">Toggle</span>
                  </summary>

                  <div className="mt-4 grid gap-2">
                    {squad
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const isC = cId === p.id;
                        const isVC = vcId === p.id;
                        return (
                          <div
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-neutral-950/35 px-3 py-2 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-neutral-100">
                                {p.name}{" "}
                                {isC ? <span className="text-blue-200">(C)</span> : isVC ? <span className="text-sky-200">(VC)</span> : null}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {p.nationality ? `${p.nationality} · ` : ""}
                                {p.is_overseas ? "Overseas · " : ""}
                                {p.role}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 border-white/10 text-neutral-300">
                              {p.role}
                            </Badge>
                          </div>
                        );
                      })}
                    {squad.length === 0 ? (
                      <Card className="border-amber-500/25 bg-amber-950/15">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">No players imported</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-amber-100/90">
                          {isHost ? "Import a sheet to populate this roster." : "Ask the host to import a sheet."}
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ) : null}
      <LeagueClient leagueId={league.id} isHost={isHost} teams={teams} />
    </div>
  );
}

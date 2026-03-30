import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuctionRoom } from "@/lib/sports/types";
import { ChevronRight } from "lucide-react";

export function RoomCard({
  room,
  teamsCount,
  role,
}: {
  room: AuctionRoom;
  teamsCount: number;
  role: "host" | "member";
}) {
  const status = room.status;
  const badgeVariant = status === "live" ? "live" : status === "completed" ? "secondary" : "outline";

  const href =
    status === "lobby" || status === "paused"
      ? `/room/${room.id}/lobby`
      : status === "live"
        ? `/room/${room.id}/auction`
        : `/room/${room.id}/results`;

  const cfg = room.config as { maxTeams?: number };
  const maxTeams = cfg.maxTeams ?? 10;

  return (
    <Link href={href} className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070708]">
      <Card className="aa-card-interactive h-full rounded-2xl border-neutral-800/90 bg-neutral-950/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold text-white transition-colors group-hover:text-emerald-100">
            {room.name}
          </CardTitle>
          <ChevronRight className="h-5 w-5 shrink-0 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400 motion-reduce:group-hover:translate-x-0" />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
          <Badge variant={badgeVariant}>{status.toUpperCase()}</Badge>
          <span className="text-neutral-500">
            {teamsCount}/{maxTeams} teams
          </span>
          <span className="text-neutral-600">·</span>
          <span className={role === "host" ? "font-medium text-amber-200/90" : ""}>
            {role === "host" ? "You host" : "Playing"}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="font-mono text-xs tracking-wider text-emerald-500/90">{room.invite_code}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

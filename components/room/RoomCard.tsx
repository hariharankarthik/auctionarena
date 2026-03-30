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
    <Link href={href}>
      <Card className="border-neutral-800 transition-colors hover:border-emerald-700/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{room.name}</CardTitle>
          <ChevronRight className="h-4 w-4 text-neutral-500" />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
          <Badge variant={badgeVariant}>{status.toUpperCase()}</Badge>
          <span>
            {teamsCount}/{maxTeams} teams
          </span>
          <span className="text-neutral-600">·</span>
          <span>{role === "host" ? "You host" : "Member"}</span>
          <span className="text-neutral-600">·</span>
          <span className="font-mono tracking-wide">{room.invite_code}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

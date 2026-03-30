"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuctionRoom } from "@/hooks/useAuctionRoom";
import { Button } from "@/components/ui/button";
import { TeamSlot } from "./TeamSlot";
import type { AuctionTeam } from "@/lib/sports/types";

export function LobbyView({
  roomId,
  isHost,
  myTeamId,
  inviteCode,
}: {
  roomId: string;
  isHost: boolean;
  myTeamId: string | null;
  inviteCode: string;
}) {
  const router = useRouter();
  const { room, teams, loading } = useAuctionRoom(roomId);
  const [starting, setStarting] = useState(false);

  const appUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/room/${roomId}/lobby`;
  }, [roomId]);

  const allReady = teams.length >= 2 && teams.every((t) => t.is_ready);
  const canStart = isHost && allReady && room?.status === "lobby";

  async function toggleReady(next: boolean) {
    if (!myTeamId) {
      toast.error("You need a team in this room");
      return;
    }
    const res = await fetch("/api/room/ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: myTeamId, is_ready: next }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error || "Failed");
  }

  async function startAuction() {
    setStarting(true);
    try {
      const res = await fetch("/api/room/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(`/room/${roomId}/auction`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Start failed");
    } finally {
      setStarting(false);
    }
  }

  if (loading || !room) {
    return <p className="p-6 text-neutral-400">Loading lobby…</p>;
  }

  if (room.status === "live") {
    router.replace(`/room/${roomId}/auction`);
    return null;
  }

  if (room.status === "completed") {
    router.replace(`/room/${roomId}/results`);
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">{room.name}</h1>
        <p className="text-sm text-neutral-500">Lobby · code {inviteCode}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(inviteCode);
              toast.success("Code copied");
            }}
          >
            Copy code
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(appUrl);
              toast.success("Link copied");
            }}
          >
            Copy invite link
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">Teams</h2>
        {teams.map((t: AuctionTeam) => (
          <TeamSlot key={t.id} team={t} />
        ))}
      </div>
      {myTeamId ? (
        <div className="flex gap-2">
          <Button type="button" onClick={() => void toggleReady(true)}>
            Mark ready
          </Button>
          <Button type="button" variant="outline" onClick={() => void toggleReady(false)}>
            Not ready
          </Button>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Join this room with a team to toggle ready.</p>
      )}
      {isHost ? (
        <Button type="button" disabled={!canStart || starting} onClick={() => void startAuction()}>
          Start auction
        </Button>
      ) : null}
      {!isHost ? <p className="text-xs text-neutral-600">Waiting for host to start when everyone is ready.</p> : null}
    </div>
  );
}

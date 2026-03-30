"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useAuctionRoom } from "@/hooks/useAuctionRoom";
import { useTimer } from "@/hooks/useTimer";
import { createClient } from "@/lib/supabase/client";
import type { PlayerRow, RoomRuntimeConfig } from "@/lib/sports/types";
import { playSound } from "@/lib/sounds";
import { formatCurrencyLakhsToCr } from "@/lib/utils";
import { PlayerCard } from "./PlayerCard";
import { BidControls } from "./BidControls";
import { BidFeed } from "./BidFeed";
import { PurseTracker } from "./PurseTracker";
import { SquadTracker } from "./SquadTracker";
import { TimerDisplay } from "./Timer";
import { SoldOverlay } from "./SoldOverlay";
import { AuctionControls } from "./AuctionControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AuctionRoomView({
  roomId,
  userId,
  myTeamId,
}: {
  roomId: string;
  userId: string;
  myTeamId: string | null;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { room, teams, bids, loading } = useAuctionRoom(roomId);
  const cfg = (room?.config ?? {}) as RoomRuntimeConfig;
  const duration = cfg.timerSeconds ?? 30;
  const increments = cfg.bidIncrements ?? [5, 10, 20, 25, 50, 100];
  const isHost = room?.host_id === userId;
  const { timeLeft, start, reset } = useTimer(roomId, isHost, duration);
  const reduceMotion = useReducedMotion();

  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [mySquad, setMySquad] = useState<PlayerRow[]>([]);
  const [soldOverlay, setSoldOverlay] = useState<{ open: boolean; label: string }>({ open: false, label: "" });
  const prevTick = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && room && room.status !== "live") {
      router.replace(`/room/${roomId}/lobby`);
    }
  }, [loading, room, roomId, router]);

  useEffect(() => {
    if (!room?.current_player_id) {
      setPlayer(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from("players")
      .select("*")
      .eq("id", room.current_player_id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setPlayer((data as PlayerRow) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [room?.current_player_id, supabase]);

  useEffect(() => {
    if (!myTeamId) {
      setMySquad([]);
      return;
    }
    let cancelled = false;
    async function loadSquad() {
      const { data: results } = await supabase
        .from("auction_results")
        .select("player_id")
        .eq("room_id", roomId)
        .eq("team_id", myTeamId)
        .eq("is_unsold", false);
      const ids = (results ?? []).map((r) => r.player_id).filter(Boolean);
      if (!ids.length) {
        if (!cancelled) setMySquad([]);
        return;
      }
      const { data: plist } = await supabase.from("players").select("*").in("id", ids);
      if (!cancelled) setMySquad((plist as PlayerRow[]) ?? []);
    }
    void loadSquad();
    const ch = supabase
      .channel(`results:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "auction_results", filter: `room_id=eq.${roomId}` },
        () => void loadSquad(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(ch);
    };
  }, [myTeamId, roomId, supabase]);

  const currentBidderName = useMemo(() => {
    if (!room?.current_bidder_team_id) return "—";
    return teams.find((t) => t.id === room.current_bidder_team_id)?.team_name ?? "Team";
  }, [room?.current_bidder_team_id, teams]);

  useEffect(() => {
    if (timeLeft === 0 && isHost && room?.status === "live") {
      toast.message("Timer at 0 — finalize the lot (Sold / Unsold).");
    }
  }, [timeLeft, isHost, room?.status]);

  useEffect(() => {
    if (timeLeft <= 0) {
      prevTick.current = timeLeft;
      return;
    }
    const prev = prevTick.current;
    if (prev !== null) {
      if (prev > 10 && timeLeft <= 10) playSound("timerWarning");
      if (prev > 5 && timeLeft <= 5) playSound("timerWarning");
    }
    prevTick.current = timeLeft;
  }, [timeLeft]);

  if (loading || !room) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="aa-skeleton h-8 w-1/2 max-w-xs rounded-lg" />
        <div className="aa-skeleton h-48 w-full rounded-2xl" />
        <div className="aa-skeleton h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (room.status !== "live") {
    return (
      <div className="flex min-h-[30vh] items-center justify-center p-8 text-sm text-neutral-500">
        Taking you back to the lobby…
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl gap-6 p-4 sm:p-6 lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
      <SoldOverlay open={soldOverlay.open} label={soldOverlay.label} />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400/90">On the block</p>
            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{room.name}</h1>
          </div>
          <Badge variant="live" className="animate-pulse px-3 py-1 text-xs motion-reduce:animate-none">
            LIVE
          </Badge>
        </div>
        <PlayerCard player={player} />
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 to-neutral-950/90 p-5 ring-1 ring-emerald-500/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Current bid</p>
          <motion.p
            key={room.current_bid}
            initial={reduceMotion ? undefined : { scale: 1.04, opacity: 0.85 }}
            animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
            transition={reduceMotion ? undefined : { type: "spring", stiffness: 380, damping: 22 }}
            className="mt-1 text-3xl font-bold tabular-nums text-emerald-300 sm:text-4xl"
          >
            {formatCurrencyLakhsToCr(room.current_bid)}
          </motion.p>
          <p className="mt-2 text-sm text-neutral-400">
            Leading: <span className="font-medium text-neutral-200">{currentBidderName}</span>
          </p>
        </div>
        <TimerDisplay seconds={timeLeft} />
        {isHost ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                reset(duration);
                start();
              }}
            >
              Start timer
            </Button>
            <Button type="button" variant="outline" onClick={() => reset(duration)}>
              Reset timer
            </Button>
          </div>
        ) : null}
        <BidControls
          roomId={roomId}
          teamId={myTeamId}
          currentBid={room.current_bid}
          basePrice={player?.base_price ?? 0}
          disabled={room.status !== "live"}
          increments={increments}
        />
        {isHost ? (
          <div className="space-y-2">
            <p className="text-xs uppercase text-neutral-500">Host controls</p>
            <AuctionControls
              roomId={roomId}
              onLotFinalized={(info) => {
                setSoldOverlay({ open: true, label: info.wasSold ? "SOLD!" : "UNSOLD" });
                if (info.wasSold) playSound("gavel");
                window.setTimeout(() => setSoldOverlay((s) => ({ ...s, open: false })), 1400);
              }}
            />
          </div>
        ) : null}
      </div>
      <div className="mt-8 space-y-4 lg:mt-0">
        <PurseTracker teams={teams} sportId={room.sport_id} />
        {room.sport_id && myTeamId ? (
          <SquadTracker sportId={room.sport_id} players={mySquad} teamLabel="Your squad" />
        ) : null}
        <BidFeed bids={bids} teams={teams} />
      </div>
    </div>
  );
}

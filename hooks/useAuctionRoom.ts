"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuctionRoom, AuctionTeam, BidRow } from "@/lib/sports/types";

export function useAuctionRoom(roomId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [room, setRoom] = useState<AuctionRoom | null>(null);
  const [teams, setTeams] = useState<AuctionTeam[]>([]);
  const [bids, setBids] = useState<BidRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [r, t, b] = await Promise.all([
        supabase.from("auction_rooms").select("*").eq("id", roomId).single(),
        supabase.from("auction_teams").select("*").eq("room_id", roomId),
        supabase
          .from("bids")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (cancelled) return;
      setRoom((r.data as AuctionRoom) ?? null);
      setTeams((t.data as AuctionTeam[]) ?? []);
      setBids((b.data as BidRow[]) ?? []);
      setLoading(false);
    }

    void load();

    const channel = supabase
      .channel(`auction:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auction_rooms", filter: `id=eq.${roomId}` },
        (payload) => setRoom(payload.new as AuctionRoom),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auction_teams", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const row = payload.new as AuctionTeam;
          setTeams((prev) => {
            const i = prev.findIndex((x) => x.id === row.id);
            if (payload.eventType === "INSERT" && i < 0) return [...prev, row];
            if (i >= 0) {
              const next = [...prev];
              next[i] = row;
              return next;
            }
            return prev;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `room_id=eq.${roomId}` },
        (payload) => setBids((prev) => [payload.new as BidRow, ...prev].slice(0, 100)),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  return { room, teams, bids, loading };
}

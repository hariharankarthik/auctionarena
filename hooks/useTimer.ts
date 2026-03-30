"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useTimer(roomId: string, isHost: boolean, duration: number) {
  const supabase = useMemo(() => createClient(), []);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  useEffect(() => {
    const ch = supabase.channel(`timer:${roomId}`);
    channelRef.current = ch;

    if (!isHost) {
      ch.on("broadcast", { event: "tick" }, ({ payload }) => {
        const t = (payload as { timeLeft?: number }).timeLeft;
        if (typeof t === "number") setTimeLeft(t);
      })
        .on("broadcast", { event: "reset" }, ({ payload }) => {
          const d = (payload as { duration?: number }).duration;
          if (typeof d === "number") setTimeLeft(d);
        })
        .on("broadcast", { event: "freeze" }, ({ payload }) => {
          const t = (payload as { timeLeft?: number }).timeLeft;
          if (typeof t === "number") setTimeLeft(t);
        });
    }

    void ch.subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [roomId, isHost, supabase]);

  const start = useCallback(() => {
    if (!isHost) return;
    setIsRunning(true);
    setTimeLeft(duration);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        void channelRef.current?.send({
          type: "broadcast",
          event: "tick",
          payload: { timeLeft: next },
        });
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
        }
        return next;
      });
    }, 1000);
  }, [isHost, duration]);

  const reset = useCallback(
    (newDuration?: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      const d = newDuration ?? duration;
      setTimeLeft(d);
      setIsRunning(false);
      void channelRef.current?.send({
        type: "broadcast",
        event: "reset",
        payload: { duration: d },
      });
    },
    [duration],
  );

  /** Stop countdown and sync guests (e.g. auction paused). Does not change the displayed second. */
  const freeze = useCallback(() => {
    if (!isHost) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    const t = timeLeftRef.current;
    void channelRef.current?.send({
      type: "broadcast",
      event: "freeze",
      payload: { timeLeft: t },
    });
  }, [isHost]);

  return { timeLeft, isRunning, start, reset, freeze };
}

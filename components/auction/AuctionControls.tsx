"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AuctionControls({ roomId }: { roomId: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function post(url: string, body: object) {
    setLoading(url);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      toast.success("Updated");
      return data as { completed?: boolean };
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      return null;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={!!loading}
        onClick={() => post("/api/auction/pause", { room_id: roomId, paused: true })}
      >
        Pause
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={!!loading}
        onClick={() => post("/api/auction/pause", { room_id: roomId, paused: false })}
      >
        Resume
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        onClick={() => post("/api/auction/unsold", { room_id: roomId })}
      >
        Unsold
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        onClick={() => post("/api/auction/next-player", { room_id: roomId })}
      >
        Next
      </Button>
      <Button
        size="sm"
        disabled={!!loading}
        onClick={async () => {
          const r = await post("/api/auction/sold", { room_id: roomId });
          if (r?.completed) window.location.href = `/room/${roomId}/results`;
        }}
      >
        Sold / End lot
      </Button>
    </div>
  );
}

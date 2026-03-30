"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IPL_2026 } from "@/lib/sports/ipl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateRoomForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [purse, setPurse] = useState(String(IPL_2026.purse.default));
  const [timer, setTimer] = useState(String(IPL_2026.timer.default));
  const [maxTeams, setMaxTeams] = useState(String(IPL_2026.roster.maxTeams));
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sport_id: IPL_2026.id,
          purse: Number(purse),
          timer_seconds: Number(timer),
          max_teams: Number(maxTeams),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`Room created · code ${data.invite_code}`);
      router.push(`/room/${data.room_id}/lobby`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg border-neutral-800">
      <CardHeader>
        <CardTitle>Create IPL room</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="rname">Room name</Label>
            <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Friday Night Auction" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purse">Purse (lakhs)</Label>
            <Input id="purse" type="number" value={purse} onChange={(e) => setPurse(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timer">Timer (seconds)</Label>
            <Input id="timer" type="number" value={timer} onChange={(e) => setTimer(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxt">Max teams</Label>
            <Input id="maxt" type="number" value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Create room
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    if (!code.trim() || !teamName.trim()) {
      toast.error("Invite code and team name required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code.trim(), team_name: teamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Join failed");
      toast.success("Joined room");
      setOpen(false);
      router.push(`/room/${data.room_id}/lobby`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Join failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Join room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join with invite code</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="code">Invite code</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC12X" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tname">Team name</Label>
            <Input id="tname" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Super Kings FC" />
          </div>
          <Button className="w-full" disabled={loading} onClick={join}>
            Join
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

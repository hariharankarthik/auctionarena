"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ClaimTeamButton({ leagueId, teamId }: { leagueId: string; teamId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function claim() {
    setBusy(true);
    try {
      const res = await fetch("/api/leagues/private/claim-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league_id: leagueId, team_id: teamId }),
      });
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok) throw new Error(data.error || "Claim failed");
      toast.success("Team claimed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void claim()}>
      {busy ? "Claiming…" : "Claim this team"}
    </Button>
  );
}


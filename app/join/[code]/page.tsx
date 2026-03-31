import { createClient } from "@/lib/supabase/server";
import { loginUrlWithNext } from "@/lib/safe-path";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = (raw ?? "").trim().toUpperCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Preserve the join target through OAuth.
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="aa-display text-2xl font-semibold text-white">Sign in to join</h1>
        <p className="text-sm text-neutral-500">We’ll send you right back after login.</p>
        <Button asChild size="lg" className="h-11">
          <Link href={loginUrlWithNext(`/join/${encodeURIComponent(code)}`)}>Continue</Link>
        </Button>
      </main>
    );
  }

  // Auction room invite?
  const { data: room } = await supabase.from("auction_rooms").select("id").eq("invite_code", code).maybeSingle();
  if (room?.id) {
    return (
      <meta httpEquiv="refresh" content={`0; url=/room/${room.id}/lobby`} />
    );
  }

  // Private league invite?
  const { data: league } = await supabase
    .from("fantasy_leagues")
    .select("id, league_kind")
    .eq("invite_code", code)
    .maybeSingle();
  if (league?.id) {
    const dest = league.league_kind === "private" ? `/league/private/${league.id}` : `/league/${league.id}`;
    return <meta httpEquiv="refresh" content={`0; url=${dest}`} />;
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="aa-display text-2xl font-semibold text-white">Invalid code</h1>
      <p className="text-sm text-neutral-500">
        <span className="font-mono text-neutral-300">{code}</span> wasn’t found. Check with your host and try again.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild variant="secondary">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}


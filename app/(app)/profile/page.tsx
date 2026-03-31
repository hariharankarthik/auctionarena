import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  const displayName =
    profile?.display_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    (user?.user_metadata?.name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "Profile";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader title="Profile" subtitle="Your account details" />

      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-blue-950/25 via-neutral-950/70 to-white/5">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/25 via-white/10 to-amber-500/10 ring-1 ring-white/10" />
              <div className="min-w-0">
                <p className="aa-display truncate text-xl font-semibold text-white">{displayName}</p>
                <p className="mt-0.5 text-sm text-neutral-400">{profile?.username ?? "—"}</p>
              </div>
            </div>
            <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-300 ring-1 ring-white/10">
              Signed in
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-neutral-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Email</p>
              <p className="mt-2 truncate text-sm font-medium text-neutral-100">{user?.email ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-neutral-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Username</p>
              <p className="mt-2 truncate text-sm font-medium text-neutral-100">{profile?.username ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-neutral-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Display name</p>
              <p className="mt-2 truncate text-sm font-medium text-neutral-100">{profile?.display_name ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">What you can do next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-400">
          <ul className="list-disc space-y-2 pl-4">
            <li>Create an auction room, or create a private league for offline squads.</li>
            <li>Pick your Playing XI and keep captain/vice-captain updated.</li>
            <li>Share invite codes with friends and track fantasy scores together.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

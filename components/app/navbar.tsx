import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-emerald-400">
          AuctionArena
        </Link>
        <nav className="flex items-center gap-3 text-sm text-neutral-300">
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <Link href="/practice" className="hover:text-white">
            Practice
          </Link>
          <Link href="/profile" className="hover:text-white">
            Profile
          </Link>
          {user ? (
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

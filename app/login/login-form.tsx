"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  async function signUpEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Check your email to confirm, or sign in if already confirmed.");
  }

  async function signInGoogle() {
    setLoading(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    setLoading(false);
    if (error) setMessage(error.message);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6">
      <Card className="w-full max-w-md border-neutral-800">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>AuctionArena — IPL auctions with friends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" variant="secondary" className="w-full" disabled={loading} onClick={signInGoogle}>
            Continue with Google
          </Button>
          <div className="relative py-2 text-center text-xs text-neutral-500">
            <span className="bg-neutral-950 px-2">or email</span>
          </div>
          <form className="space-y-3" onSubmit={signInEmail}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {message ? <p className="text-sm text-amber-400">{message}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                Sign in
              </Button>
              <Button type="button" variant="outline" className="flex-1" disabled={loading} onClick={signUpEmail}>
                Sign up
              </Button>
            </div>
          </form>
          <p className="text-center text-sm text-neutral-500">
            <Link href="/" className="text-emerald-400 hover:underline">
              ← Back home
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

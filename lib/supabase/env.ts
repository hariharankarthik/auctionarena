/**
 * Legacy JWT `anon` `public` key, or Supabase’s newer publishable key (dashboard “API keys”).
 * Either works with @supabase/ssr + supabase-js in current versions.
 */
export function resolveSupabasePublishableKey(): string | undefined {
  const a = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (a) return a;
  const b = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (b) return b;
  const c = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (c) return c;
  return undefined;
}

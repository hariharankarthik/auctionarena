import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseCookieToSet } from "@/lib/supabase/cookie-types";
import { resolveSupabasePublishableKey } from "@/lib/supabase/env";

const placeholderUrl = "https://placeholder.supabase.co";
const placeholderKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.placeholder";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || placeholderUrl;
  const key = resolveSupabasePublishableKey() || placeholderKey;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: SupabaseCookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Server Component — ignore */
        }
      },
    },
  });
}

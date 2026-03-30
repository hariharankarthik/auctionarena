import { createBrowserClient } from "@supabase/ssr";

const placeholderUrl = "https://placeholder.supabase.co";
const placeholderKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.placeholder";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || placeholderUrl;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || placeholderKey;
  return createBrowserClient(url, key);
}

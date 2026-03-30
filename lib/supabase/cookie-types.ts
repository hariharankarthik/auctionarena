/** Items passed to the `cookies.setAll` callback from `@supabase/ssr` `createServerClient`. */
export type SupabaseCookieToSet = {
  name: string;
  value: string;
  options?: {
    path?: string;
    maxAge?: number;
    domain?: string;
    sameSite?: "strict" | "lax" | "none" | boolean;
    httpOnly?: boolean;
    secure?: boolean;
    expires?: Date;
  };
};

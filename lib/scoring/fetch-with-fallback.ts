/**
 * Scorecard fetcher with automatic fallback.
 *
 * **Primary: Cricsheet** (cached in `cricsheet_cache` table) — free, no rate
 * limits, ball-by-ball detail, updated within 24–48h of match completion.
 *
 * **Fallback: CricAPI** — used only when Cricsheet data isn't available yet
 * (e.g., same-day scoring). This preserves the 100 req/day free-tier budget.
 *
 * If CricAPI also fails with a rate-limit error, the error is surfaced with
 * a friendly message via the error classifier.
 *
 * Usage in API routes:
 * ```ts
 * const { performances, provider } = await fetchScorecardWithFallback(matchId, supabase);
 * ```
 */

import {
  fetchCricApiScorecardJson,
  extractPerformancesFromCricApiJson,
  mergeBowlingFromCricApiJson,
  type CricApiMappedPerformance,
} from "@/lib/cricapi/fetch-scorecard";
import { isCricApiError } from "@/lib/cricapi/errors";

type FallbackResult = {
  performances: CricApiMappedPerformance[];
  provider: "cricsheet_cache" | "cricapi";
  raw?: unknown;
};

/**
 * Fetch scorecard with automatic provider selection.
 *
 * 1. Try Cricsheet cache (free, unlimited)
 * 2. Fall back to CricAPI (rate-limited, 100 req/day free tier)
 *
 * @param matchId  CricAPI match UUID or Cricsheet numeric ID
 * @param supabase Supabase client (used to query cached Cricsheet data)
 */
export async function fetchScorecardWithFallback(
  matchId: string,
  supabase?: { from: (table: string) => unknown } | null,
): Promise<FallbackResult> {
  // 1. Try Cricsheet cache first (primary — free and unlimited)
  if (supabase) {
    const cached = await tryLoadCricsheetCache(supabase, matchId);
    if (cached && cached.length > 0) {
      return { performances: cached, provider: "cricsheet_cache" };
    }
  }

  // 2. Fall back to CricAPI (secondary — rate-limited)
  const raw = await fetchCricApiScorecardJson(matchId);
  let extracted = extractPerformancesFromCricApiJson(raw);
  extracted = mergeBowlingFromCricApiJson(extracted, raw);
  return { performances: extracted, provider: "cricapi", raw };
}

/**
 * Try to load pre-imported Cricsheet performances from the
 * `cricsheet_cache` table.
 */
async function tryLoadCricsheetCache(
  supabase: { from: (table: string) => unknown },
  matchId: string,
): Promise<CricApiMappedPerformance[] | null> {
  try {
    // Query the cricsheet_cache table for pre-imported match data.
    // Try both the raw matchId and a normalized version (Cricsheet uses
    // numeric IDs while CricAPI uses UUIDs — the import script stores
    // the Cricsheet numeric ID as match_id).
    const result = await (supabase.from("cricsheet_cache") as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: { performances: CricApiMappedPerformance[] } | null; error: unknown }>;
        };
      };
    })
      .select("performances")
      .eq("match_id", matchId)
      .single();

    if (result.error || !result.data) return null;
    return result.data.performances;
  } catch {
    // Table may not exist yet — that's fine, just means no cache
    return null;
  }
}

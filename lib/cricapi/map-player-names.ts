import type { PlayerMatchStats } from "@/lib/fantasy-scoring";
import { normalizeName } from "@/lib/cricapi/fetch-scorecard";

export type DbPlayer = { id: string; name: string };

/**
 * Map a single CricAPI/scorecard display name to one row in our players table.
 * Handles short initials (e.g. "V Kohli" → "Virat Kohli") when the last name is unique.
 */
/** Normalize with extra cleanup: strip dots, hyphens, apostrophes */
function deepNormalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.\-']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchDbPlayerForCricApiName(list: DbPlayer[], cricName: string): DbPlayer | null {
  const key = normalizeName(cricName);
  if (!key) return null;

  // Stage 1: Exact normalized match
  const exact = list.find((p) => normalizeName(p.name) === key);
  if (exact) return exact;

  // Stage 1b: Deep normalize (strip dots, hyphens, apostrophes)
  const deepKey = deepNormalize(cricName);
  const deepExact = list.find((p) => deepNormalize(p.name) === deepKey);
  if (deepExact) return deepExact;

  // Stage 2: Fuzzy substring match (both directions)
  const fuzzy = list.find(
    (p) =>
      key.length >= 4 &&
      (normalizeName(p.name).includes(key) || key.includes(normalizeName(p.name))),
  );
  if (fuzzy) return fuzzy;

  const parts = key.split(/\s+/).filter(Boolean);
  const last = parts.length ? parts[parts.length - 1]! : "";

  // Stage 3: Last name match (unique)
  const lastNameMatches = list.filter((p) => {
    const pn = normalizeName(p.name);
    const pParts = pn.split(/\s+/).filter(Boolean);
    const pLast = pParts.length ? pParts[pParts.length - 1]! : "";
    return pLast === last;
  });

  // For short last names (< 4 chars), try full-string contains before giving up
  if (last.length < 4) {
    if (lastNameMatches.length === 1) return lastNameMatches[0]!;
    // Try: does the full CricAPI name appear as a substring of any DB name?
    const containsMatch = list.filter((p) => deepNormalize(p.name).includes(deepKey));
    if (containsMatch.length === 1) return containsMatch[0]!;
    // Fall through to initial-based matching below if we have last name matches
    if (lastNameMatches.length === 0) return null;
  } else {
    if (lastNameMatches.length === 1) return lastNameMatches[0]!;
  }

  // Stage 4: Initial + last name disambiguation
  if (parts.length >= 2 && parts[0]!.length <= 3 && lastNameMatches.length > 0) {
    const initial = parts[0]!;
    const narrowed = lastNameMatches.filter((p) => {
      const pn = normalizeName(p.name);
      const firstWord = pn.split(/\s+/).filter(Boolean)[0] ?? "";
      return firstWord.startsWith(initial);
    });
    if (narrowed.length === 1) return narrowed[0]!;

    // Stage 4b: Try 2-char first name prefix when initial matching fails
    if (narrowed.length === 0 && initial.length >= 2) {
      const prefix2 = initial.slice(0, 2);
      const byPrefix = lastNameMatches.filter((p) => {
        const pn = normalizeName(p.name);
        const firstWord = pn.split(/\s+/).filter(Boolean)[0] ?? "";
        return firstWord.startsWith(prefix2);
      });
      if (byPrefix.length === 1) return byPrefix[0]!;
    }
  }

  return null;
}

export type ExtractedRow = { playerName: string; stats: PlayerMatchStats };

export function mapCricApiExtractedToPerformances(
  list: DbPlayer[],
  extracted: ExtractedRow[],
): { performances: Array<{ player_id: string } & PlayerMatchStats>; unmatched: string[] } {
  const performances: Array<{ player_id: string } & PlayerMatchStats> = [];
  const unmatched: string[] = [];

  for (const row of extracted) {
    const p = matchDbPlayerForCricApiName(list, row.playerName);
    if (!p) {
      unmatched.push(row.playerName);
      continue;
    }
    performances.push({ player_id: p.id, ...row.stats });
  }

  return { performances, unmatched };
}

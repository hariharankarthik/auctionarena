/**
 * Pure helpers for CricAPI `currentMatches` → match id list (used by Vercel cron).
 */

/** `includes("ipl")` matches unrelated words (e.g. "multiple", "triple"); require whole token. */
export function matchNameContainsSeriesToken(haystackLower: string, sub: string): boolean {
  const s = sub.trim().toLowerCase();
  if (!s) return false;
  if (s === "ipl") return /\bipl\b/.test(haystackLower);
  return haystackLower.includes(s);
}

export type DiscoverMatchIdsOptions = {
  /** `YYYY-MM-DD` prefix or `""` to skip date filtering */
  matchDatePrefix: string;
  teamSubstrings: string[];
  /**
   * Name/title substrings (e.g. "indian premier league"). Empty = do not filter by name.
   * When `seriesIdFilter` is set and this is empty, only `series_id` is used for league scoping.
   */
  seriesSubstrings: string[];
  /** CricAPI `series_id` UUID; when set, only matches in this series pass. */
  seriesIdFilter: string | null;
};

export function extractMatchIdsFromCurrentMatchesJson(
  raw: unknown,
  opts: DiscoverMatchIdsOptions,
): string[] {
  const { matchDatePrefix, teamSubstrings, seriesSubstrings, seriesIdFilter } = opts;
  const obj = raw as Record<string, unknown>;
  const matchesRaw = obj?.["matches"] ?? obj?.["data"];
  const matches: unknown[] = Array.isArray(matchesRaw) ? matchesRaw : [];
  const uniqueIds: string[] = [];

  const norm = (s: unknown) => String(s ?? "").toLowerCase();
  const pickTeamName = (t: unknown) => {
    if (!t) return "";
    if (typeof t === "string") return t;
    if (typeof t === "object") {
      const o = t as Record<string, unknown>;
      return String(o.name ?? o.shortname ?? o.shortName ?? o.title ?? o.teamName ?? "");
    }
    return "";
  };

  const filterNorm = seriesIdFilter?.trim().toLowerCase() ?? "";

  for (const m of matches) {
    if (!m || typeof m !== "object") continue;
    const mm = m as Record<string, unknown>;
    const uid = mm["unique_id"] ?? mm["uniqueId"] ?? mm["id"] ?? mm["match_id"] ?? mm["matchId"];
    if (!uid) continue;

    const sid = String(mm["series_id"] ?? mm["seriesId"] ?? "").trim().toLowerCase();
    if (filterNorm) {
      if (sid !== filterNorm) continue;
    }

    const teamsRaw = mm?.teams;
    const teamInfoRaw = mm?.teamInfo ?? mm?.teaminfo ?? mm?.teamsInfo;
    const teamInfo = Array.isArray(teamInfoRaw) ? teamInfoRaw : [];

    const team1Name =
      String(mm?.["team-1"] ?? mm?.team1 ?? mm?.team_1 ?? "") ||
      pickTeamName(teamInfo[0]) ||
      pickTeamName(Array.isArray(teamsRaw) ? teamsRaw[0] : undefined);
    const team2Name =
      String(mm?.["team-2"] ?? mm?.team2 ?? mm?.team_2 ?? "") ||
      pickTeamName(teamInfo[1]) ||
      pickTeamName(Array.isArray(teamsRaw) ? teamsRaw[1] : undefined);

    const team1 = norm(team1Name);
    const team2 = norm(team2Name);
    const type = norm(mm?.type);
    const started = Boolean(mm?.matchStarted);
    const date = norm(mm?.date ?? mm?.dateTimeGMT ?? mm?.dateTime ?? mm?.matchDate ?? mm?.match_datetime);
    const name = norm(mm?.name ?? mm?.title ?? mm?.series ?? mm?.matchType);

    if (seriesSubstrings.length > 0) {
      const matchesSeries = seriesSubstrings.some((sub) => matchNameContainsSeriesToken(name, sub));
      if (!matchesSeries) continue;
    }

    const matchesTeam = teamSubstrings.length
      ? teamSubstrings.some((sub) => {
          const ss = sub.toLowerCase();
          return team1.includes(ss) || team2.includes(ss);
        })
      : true;
    if (!matchesTeam) continue;

    const dateOk = matchDatePrefix ? date.startsWith(matchDatePrefix.toLowerCase()) : true;
    if (!dateOk) continue;
    if (!started && type) {
      // keep parity with route: type present without started still allowed if dateOk
    }

    uniqueIds.push(String(uid));
  }

  const seen = new Set<string>();
  return uniqueIds.filter((x) => (seen.has(x) ? false : (seen.add(x), true)));
}

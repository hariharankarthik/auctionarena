import { describe, expect, it } from "vitest";
import {
  extractMatchIdsFromCurrentMatchesJson,
  matchNameContainsSeriesToken,
} from "@/lib/cricapi/discover-match-ids";

const IPL_SERIES_ID = "87c62aac-bc3c-4738-ab93-19da0690488f";

function payload(rows: Record<string, unknown>[]) {
  return { data: rows, status: "success" };
}

describe("matchNameContainsSeriesToken", () => {
  it("matches whole word ipl only", () => {
    expect(matchNameContainsSeriesToken("indian premier league 2026", "ipl")).toBe(false);
    expect(matchNameContainsSeriesToken("foo ipl bar", "ipl")).toBe(true);
    expect(matchNameContainsSeriesToken("multiple hundreds", "ipl")).toBe(false);
  });
});

describe("extractMatchIdsFromCurrentMatchesJson", () => {
  it("filters by series_id when CRICAPI_IPL_SERIES_ID mode (no name substrings)", () => {
    const rows = [
      {
        id: "ipl-a",
        name: "Team A vs Team B, Indian Premier League 2026",
        date: "2026-03-30",
        series_id: IPL_SERIES_ID,
        matchStarted: true,
        teams: ["A", "B"],
      },
      {
        id: "psl-x",
        name: "Hyderabad Kingsmen vs Quetta, Pakistan Super League 2026",
        date: "2026-03-30",
        series_id: "8bfedb5a-500c-4f02-a5c3-17a3d731fe9c",
        matchStarted: true,
        teams: ["H", "Q"],
      },
    ];
    const ids = extractMatchIdsFromCurrentMatchesJson(payload(rows), {
      matchDatePrefix: "2026-03-30",
      teamSubstrings: [],
      seriesSubstrings: [],
      seriesIdFilter: IPL_SERIES_ID,
    });
    expect(ids).toEqual(["ipl-a"]);
  });

  it("still applies date prefix for series_id matches", () => {
    const rows = [
      {
        id: "ipl-yesterday",
        name: "RR vs CSK, Indian Premier League 2026",
        date: "2026-03-29",
        series_id: IPL_SERIES_ID,
        matchStarted: true,
        teams: ["RR", "CSK"],
      },
    ];
    const ids = extractMatchIdsFromCurrentMatchesJson(payload(rows), {
      matchDatePrefix: "2026-03-30",
      teamSubstrings: [],
      seriesSubstrings: [],
      seriesIdFilter: IPL_SERIES_ID,
    });
    expect(ids).toEqual([]);
  });

  it("without series_id: uses indian premier league in name", () => {
    const rows = [
      {
        id: "ipl-n",
        name: "MI vs KKR, 2nd Match, Indian Premier League 2026",
        date: "2026-03-29",
        series_id: IPL_SERIES_ID,
        matchStarted: true,
        teams: ["MI", "KKR"],
      },
      {
        id: "psl",
        name: "Lahore vs Karachi, PSL 2026",
        date: "2026-03-29",
        series_id: "psl",
        matchStarted: true,
        teams: ["L", "K"],
      },
    ];
    const ids = extractMatchIdsFromCurrentMatchesJson(payload(rows), {
      matchDatePrefix: "2026-03-29",
      teamSubstrings: [],
      seriesSubstrings: ["indian premier league"],
      seriesIdFilter: null,
    });
    expect(ids).toEqual(["ipl-n"]);
  });

  it("series_id + extra name substring both required when both provided", () => {
    const rows = [
      {
        id: "wrong-name-same-series",
        name: "Some Exhibition, IPL All-Stars 2099",
        date: "2026-03-30",
        series_id: IPL_SERIES_ID,
        matchStarted: true,
        teams: ["X", "Y"],
      },
      {
        id: "ok",
        name: "RCB vs SRH, Indian Premier League 2026",
        date: "2026-03-30",
        series_id: IPL_SERIES_ID,
        matchStarted: true,
        teams: ["RCB", "SRH"],
      },
    ];
    const ids = extractMatchIdsFromCurrentMatchesJson(payload(rows), {
      matchDatePrefix: "2026-03-30",
      teamSubstrings: [],
      seriesSubstrings: ["indian premier league"],
      seriesIdFilter: IPL_SERIES_ID,
    });
    expect(ids).toEqual(["ok"]);
  });
});

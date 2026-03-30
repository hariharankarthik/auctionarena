import { describe, expect, it } from "vitest";
import { assertCricApiScorecardPayload, extractPerformancesFromCricApiJson } from "./fetch-scorecard";

describe("assertCricApiScorecardPayload", () => {
  it("throws with reason when data is missing", () => {
    expect(() =>
      assertCricApiScorecardPayload({
        apikey: "x",
        status: "failure",
        reason: "Your limit is over.",
      }),
    ).toThrow("Your limit is over.");
  });

  it("throws failure status without reason", () => {
    expect(() => assertCricApiScorecardPayload({ status: "failure" })).toThrow("failure status");
  });

  it("throws when only reason is set (no data)", () => {
    expect(() => assertCricApiScorecardPayload({ reason: "Invalid id" })).toThrow("CricAPI: Invalid id");
  });

  it("allows success payload with data", () => {
    expect(() => assertCricApiScorecardPayload({ status: "success", data: { innings: [] } })).not.toThrow();
  });
});

describe("extractPerformancesFromCricApiJson", () => {
  it("extracts batting rows even when `batsman` key is missing", () => {
    const data = {
      data: {
        innings: [
          {
            scores: [
              [
                {
                  // CricAPI sometimes provides player name + stats without literal `batsman`
                  name: "V Kohli",
                  R: 50,
                  B: 30,
                  "4s": 4,
                  "6s": 1,
                },
              ],
            ],
          },
        ],
      },
    };

    const perf = extractPerformancesFromCricApiJson(data);
    expect(perf.length).toBe(1);
    expect(perf[0]!.playerName).toBe("V Kohli");
    expect(perf[0]!.stats.batting?.runs).toBe(50);
  });
});


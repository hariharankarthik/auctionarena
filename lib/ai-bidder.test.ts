import { describe, expect, it } from "vitest";
import { decideAiBid } from "./ai-bidder";
import { IPL_2026 } from "./sports/ipl";

describe("decideAiBid", () => {
  const baseCtx = {
    team: { remaining_purse: 5000, players_bought: 2, overseas_count: 1 },
    player: { is_overseas: false, role: "BAT" as const },
    currentBid: 100,
    basePrice: 100,
    config: IPL_2026,
    roleCounts: { BAT: 1, BOWL: 1, ALL: 0, WK: 0 },
  };

  it("easy sometimes returns null", () => {
    const outs = Array.from({ length: 30 }, () => decideAiBid(baseCtx, "easy"));
    expect(outs.some((x) => x === null)).toBe(true);
  });

  it("hard returns null or valid bid", () => {
    const bid = decideAiBid(baseCtx, "hard");
    if (bid !== null) {
      expect(bid).toBeGreaterThan(baseCtx.currentBid);
    }
  });
});

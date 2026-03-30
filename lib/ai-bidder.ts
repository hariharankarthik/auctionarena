import type { SportConfig } from "./sports/types";
import { validateBid, nextBidAmount } from "./auction-engine";

export type AiDifficulty = "easy" | "medium" | "hard";

interface AiContext {
  team: { remaining_purse: number; players_bought: number; overseas_count: number };
  player: { is_overseas: boolean; role: string } | null;
  currentBid: number;
  basePrice: number;
  config: SportConfig;
  /** Counts of each role already on AI squad */
  roleCounts: Record<string, number>;
}

function randomIncrement(config: SportConfig): number {
  const inc = config.bidIncrements;
  return inc[Math.floor(Math.random() * inc.length)]!;
}

/**
 * Decide whether AI bids and at what amount. Returns null to pass.
 */
export function decideAiBid(ctx: AiContext, difficulty: AiDifficulty): number | null {
  const { team, player, currentBid, basePrice, config, roleCounts } = ctx;
  if (!player) return null;

  const inc = randomIncrement(config);
  let target = nextBidAmount(currentBid, inc, basePrice);

  if (difficulty === "easy") {
    if (Math.random() < 0.35) return null;
    const v = validateBid(target, currentBid, team, player, config);
    return v.valid ? target : null;
  }

  if (difficulty === "medium") {
    const mins = config.roster.positionMins;
    const needBoost = Object.entries(mins).some(([role, min]) => (roleCounts[role] ?? 0) < min);
    const roleNeed = (roleCounts[player.role] ?? 0) < (mins[player.role] ?? 0);
    if (!needBoost && !roleNeed && Math.random() < 0.45) return null;
    const tries = [inc, ...config.bidIncrements.filter((x) => x !== inc)].slice(0, 4);
    for (const t of tries) {
      target = nextBidAmount(currentBid, t, basePrice);
      const v = validateBid(target, currentBid, team, player, config);
      if (v.valid) return target;
    }
    return null;
  }

  // hard: value proxy — spend more purse % on marquee / scarce roles
  const purseRatio = team.remaining_purse > 0 ? target / team.remaining_purse : 1;
  const scarcity =
    (roleCounts[player.role] ?? 0) < (config.roster.positionMins[player.role] ?? 0) ? 1.2 : 0.85;
  const tierBoost = player.role === "ALL" ? 1.1 : 1;
  const willingness = Math.min(1, 0.25 + scarcity * tierBoost * (1 - purseRatio));
  if (Math.random() > willingness) return null;

  for (const t of config.bidIncrements) {
    target = nextBidAmount(currentBid, t, basePrice);
    const v = validateBid(target, currentBid, team, player, config);
    if (v.valid) return target;
  }
  return null;
}

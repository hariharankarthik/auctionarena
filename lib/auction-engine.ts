import type { SportConfig } from "./sports/types";

export interface BidValidation {
  valid: boolean;
  error?: string;
}

export function validateBid(
  bidAmount: number,
  currentBid: number,
  team: { remaining_purse: number; players_bought: number; overseas_count: number },
  player: { is_overseas: boolean; role: string } | null,
  config: SportConfig,
): BidValidation {
  if (!player) {
    return { valid: false, error: "No player on the block" };
  }

  if (bidAmount <= currentBid) {
    return { valid: false, error: "Bid must exceed current bid" };
  }

  const slotsAfterThis = config.roster.minPlayers - team.players_bought - 1;
  const minReserve = Math.max(0, slotsAfterThis) * config.bidIncrements[0];
  if (team.remaining_purse - bidAmount < minReserve) {
    return { valid: false, error: "Insufficient purse for remaining squad" };
  }

  const overseasRule = config.roster.specialRules.find((r) => r.type === "max_foreign");
  if (overseasRule && player.is_overseas && team.overseas_count >= overseasRule.limit) {
    return { valid: false, error: `Overseas limit (${overseasRule.limit}) reached` };
  }

  if (team.players_bought >= config.roster.maxPlayers) {
    return { valid: false, error: "Squad is full" };
  }

  return { valid: true };
}

/** Next valid bid = current + chosen increment (must still pass validateBid). */
export function nextBidAmount(currentBid: number, increment: number, baseFloor: number): number {
  const floor = Math.max(currentBid, baseFloor);
  return floor + increment;
}

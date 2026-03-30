import { IPL_2026 } from "./ipl";
import { NFL_2026 } from "./nfl";
import type { SportConfig } from "./types";

const BY_ID: Record<string, SportConfig> = {
  [IPL_2026.id]: IPL_2026,
  [NFL_2026.id]: NFL_2026,
};

export function getSportConfig(sportId: string): SportConfig | null {
  return BY_ID[sportId] ?? null;
}

export { IPL_2026, NFL_2026 };

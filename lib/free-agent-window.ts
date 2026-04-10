/**
 * Returns the most recent Saturday at midnight Pacific Time as a Date.
 * The free agent window resets at this boundary each week.
 */
export function getFreeAgentWeekStart(now: Date = new Date()): Date {
  // Convert to Pacific Time using Intl to get the correct local day
  const ptStr = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const ptDate = new Date(ptStr);
  const dow = ptDate.getDay(); // 0=Sun, 6=Sat

  // Days since last Saturday: Sun=1, Mon=2, ..., Fri=6, Sat=0
  const daysSinceSat = (dow + 1) % 7;

  // Build a Date for that Saturday midnight in PT
  const satPt = new Date(ptDate);
  satPt.setDate(satPt.getDate() - daysSinceSat);
  satPt.setHours(0, 0, 0, 0);

  // Convert back to UTC by formatting as a PT midnight string and parsing
  const iso = satPt.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); // YYYY-MM-DD
  // Saturday midnight PT → UTC: PT is UTC-7 (PDT) or UTC-8 (PST)
  // Use a reliable approach: construct the date in PT and get its UTC equivalent
  const utc = new Date(`${iso}T00:00:00-07:00`);
  // Adjust for PST vs PDT by checking if the original date is in PST
  const janOffset = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
  const nowOffset = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
  ).getTimezoneOffset();
  // If we can't reliably detect, use the Intl API
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(now);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const isPST = tzName === "PST";
  const offset = isPST ? "-08:00" : "-07:00";

  return new Date(`${iso}T00:00:00${offset}`);
}

/**
 * Check if a team has already used their free agent window this week.
 */
export function isFreeAgentWindowUsed(faWindowUsedAt: string | null, now: Date = new Date()): boolean {
  if (!faWindowUsedAt) return false;
  const weekStart = getFreeAgentWeekStart(now);
  return new Date(faWindowUsedAt) >= weekStart;
}

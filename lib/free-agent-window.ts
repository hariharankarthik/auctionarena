/**
 * Returns the most recent Thursday at 3:00 PM Pacific Time as a Date.
 * The free agent window resets at this boundary each week.
 */
export function getFreeAgentWeekStart(now: Date = new Date()): Date {
  // Convert to Pacific Time using Intl to get the correct local day/time
  const ptStr = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const ptDate = new Date(ptStr);
  const dow = ptDate.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, 6=Sat

  // Days since last Thursday: Thu=0, Fri=1, Sat=2, Sun=3, Mon=4, Tue=5, Wed=6
  const daysSinceThu = (dow + 3) % 7;

  // Build the Thursday date in PT
  const thuPt = new Date(ptDate);
  thuPt.setDate(thuPt.getDate() - daysSinceThu);
  thuPt.setHours(15, 0, 0, 0);

  // If we're on Thursday but before 3:00 PM PT, use the previous Thursday
  if (daysSinceThu === 0 && ptDate < thuPt) {
    thuPt.setDate(thuPt.getDate() - 7);
  }

  // Get PT offset (PST vs PDT)
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(now);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const offset = tzName === "PST" ? "-08:00" : "-07:00";

  const iso = thuPt.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); // YYYY-MM-DD
  return new Date(`${iso}T15:00:00${offset}`);
}

/**
 * Compute the next Thursday 3:00 PM PT reset time, formatted in multiple timezones.
 */
export function getNextResetTime(now: Date = new Date()): { pt: string; ist: string; et: string; raw: Date } {
  const weekStart = getFreeAgentWeekStart(now);
  // Next reset is weekStart + 7 days
  const next = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const fmt = (tz: string) =>
    next.toLocaleString("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return {
    pt: fmt("America/Los_Angeles"),
    ist: fmt("Asia/Kolkata"),
    et: fmt("America/New_York"),
    raw: next,
  };
}

/**
 * Check if a team has already used their free agent window this week.
 */
export function isFreeAgentWindowUsed(faWindowUsedAt: string | null, now: Date = new Date()): boolean {
  if (!faWindowUsedAt) return false;
  const weekStart = getFreeAgentWeekStart(now);
  return new Date(faWindowUsedAt) >= weekStart;
}

/**
 * Lineup change time-window utility (day-aware).
 *
 * Window is OPEN when users can change their Playing XI.
 * Window is CLOSED while matches are in progress (lineup is locked).
 *
 *   Mon–Fri: CLOSED 6 AM – 3 PM PT  →  OPEN 3 PM – 6 AM (next day) PT
 *   Sat, Sun: CLOSED 3 AM – 3 PM PT  →  OPEN 3 PM – 3 AM (next day) PT
 *
 * The close hour varies by the PT day-of-week; the open hour is 3 PM PT daily.
 */

const TZ = "America/Los_Angeles";
export const WINDOW_OPEN_HOUR = 15; // 3 PM PT
export const WEEKDAY_CLOSE_HOUR = 6; // 6 AM PT (Mon–Fri)
export const WEEKEND_CLOSE_HOUR = 3; // 3 AM PT (Sat, Sun)

/** 0 = Sun, 6 = Sat. */
function isWeekend(dow: number): boolean {
  return dow === 0 || dow === 6;
}

/** Close hour for a given PT day-of-week (0=Sun..6=Sat). */
export function getWindowCloseHour(dow: number): number {
  return isWeekend(dow) ? WEEKEND_CLOSE_HOUR : WEEKDAY_CLOSE_HOUR;
}

type PtParts = {
  year: string;
  month: string;
  day: string;
  hour: number;
  minute: number;
  /** 0 = Sun .. 6 = Sat */
  dow: number;
};

/** Parse `now` into PT date-time components + PT day-of-week, DST-aware. */
function getPtParts(now: Date): PtParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  // Normalise the 24-hour edge: some runtimes return "24" for midnight.
  const rawHour = parseInt(parts.hour ?? "0", 10);
  const hour = rawHour === 24 ? 0 : rawHour;
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = dowMap[parts.weekday ?? "Sun"] ?? 0;
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour,
    minute: parseInt(parts.minute ?? "0", 10),
    dow,
  };
}

/** True when lineup changes are allowed. */
export function isLineupChangeWindowOpen(now: Date = new Date()): boolean {
  const { hour, dow } = getPtParts(now);
  const closeHour = getWindowCloseHour(dow);
  return hour >= WINDOW_OPEN_HOUR || hour < closeHour;
}

/**
 * Build a Date at a target PT hour relative to `now`, DST-aware.
 *
 * `dayOffset` is the number of PT days forward (0 = today PT, 1 = tomorrow PT).
 * We add `dayOffset * 24h + (targetHour - nowHour)h` to `now`, then snap via a
 * round-trip through the formatter to correct any DST drift.
 */
function ptDateAtHour(now: Date, nowParts: PtParts, targetHour: number, dayOffset: number): Date {
  const deltaHours = dayOffset * 24 + (targetHour - nowParts.hour);
  const deltaMinutes = -nowParts.minute;
  const candidate = new Date(now.getTime() + deltaHours * 3_600_000 + deltaMinutes * 60_000);

  // DST edge: if the candidate's PT hour differs by ±1h, nudge back to the correct hour.
  const check = getPtParts(candidate);
  if (check.hour !== targetHour) {
    return new Date(candidate.getTime() + (targetHour - check.hour) * 3_600_000);
  }
  return candidate;
}

/**
 * Current window status plus the next open/close boundaries.
 *
 * `opensAt`  — next time the window opens  (only meaningful when currently closed)
 * `closesAt` — next time the window closes (only meaningful when currently open)
 */
export function getWindowStatus(now: Date = new Date()): {
  open: boolean;
  opensAt: Date;
  closesAt: Date;
} {
  const parts = getPtParts(now);
  const { hour, dow } = parts;
  const closeHourToday = getWindowCloseHour(dow);
  const open = hour >= WINDOW_OPEN_HOUR || hour < closeHourToday;

  // opensAt: next 15:00 PT. Today if hour < 15, else tomorrow.
  const opensAt =
    hour < WINDOW_OPEN_HOUR
      ? ptDateAtHour(now, parts, WINDOW_OPEN_HOUR, 0)
      : ptDateAtHour(now, parts, WINDOW_OPEN_HOUR, 1);

  // closesAt: next close hour.
  // If currently open (hour >= 15), close happens tomorrow — use tomorrow's DOW.
  // If hour < closeHourToday, close happens today.
  // (When closed mid-day, "next close" is tomorrow's close — after reopen at 15:00.)
  let closesAt: Date;
  if (hour < closeHourToday) {
    closesAt = ptDateAtHour(now, parts, closeHourToday, 0);
  } else {
    const tomorrowDow = (dow + 1) % 7;
    const closeHourTomorrow = getWindowCloseHour(tomorrowDow);
    closesAt = ptDateAtHour(now, parts, closeHourTomorrow, 1);
  }

  return { open, opensAt, closesAt };
}

/** Format a Date in PT / ET / IST for UI display. */
export function formatWindowBoundary(d: Date): { pt: string; et: string; ist: string } {
  const fmt = (tz: string) =>
    d.toLocaleString("en-US", {
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
    et: fmt("America/New_York"),
    ist: fmt("Asia/Kolkata"),
  };
}

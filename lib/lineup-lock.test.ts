import { describe, expect, it } from "vitest";
import {
  isLineupChangeWindowOpen,
  getWindowStatus,
  getWindowCloseHour,
  formatWindowBoundary,
  WINDOW_OPEN_HOUR,
  WEEKDAY_CLOSE_HOUR,
  WEEKEND_CLOSE_HOUR,
} from "./lineup-lock";

/**
 * Build a UTC Date that lands at `hour:minute` PT on the given UTC `yyyy-mm-dd`.
 * Uses PDT (-07:00) offset. We use summer dates (PDT) for all fixtures.
 */
function makePt(yyyy: number, mm: number, dd: number, hour: number, minute = 0): Date {
  const utcHour = hour + 7; // PDT offset
  return new Date(Date.UTC(yyyy, mm - 1, dd, utcHour, minute, 0, 0));
}

// Fixture days (July 2025, all PDT):
//   Fri  = 2025-07-11
//   Sat  = 2025-07-12
//   Sun  = 2025-07-13
//   Mon  = 2025-07-14
//   Tue  = 2025-07-15

describe("getWindowCloseHour", () => {
  it("returns 6 AM for weekdays", () => {
    for (const dow of [1, 2, 3, 4, 5]) {
      expect(getWindowCloseHour(dow)).toBe(WEEKDAY_CLOSE_HOUR);
    }
  });
  it("returns 3 AM for Saturday and Sunday", () => {
    expect(getWindowCloseHour(0)).toBe(WEEKEND_CLOSE_HOUR); // Sun
    expect(getWindowCloseHour(6)).toBe(WEEKEND_CLOSE_HOUR); // Sat
  });
});

describe("isLineupChangeWindowOpen — weekdays", () => {
  it("returns true at 3 PM PT Tue (window opens)", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 15, 15))).toBe(true);
  });
  it("returns true at 11 PM PT Tue", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 15, 23))).toBe(true);
  });
  it("returns true at midnight PT Tue", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 15, 0))).toBe(true);
  });
  it("returns true at 5 AM PT Tue", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 15, 5))).toBe(true);
  });
  it("returns false at 6 AM PT Tue (weekday close)", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 15, 6))).toBe(false);
  });
  it("returns false at 10 AM PT Tue", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 15, 10))).toBe(false);
  });
  it("returns false at 2:59 PM PT Tue", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 15, 14, 59))).toBe(false);
  });
});

describe("isLineupChangeWindowOpen — weekends", () => {
  it("returns true at 2:59 AM PT Saturday", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 12, 2, 59))).toBe(true);
  });
  it("returns false at 3 AM PT Saturday (weekend close)", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 12, 3))).toBe(false);
  });
  it("returns false at 5 AM PT Saturday", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 12, 5))).toBe(false);
  });
  it("returns false at 5 AM PT Sunday", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 13, 5))).toBe(false);
  });
  it("returns true at 3 PM PT Sunday (reopen)", () => {
    expect(isLineupChangeWindowOpen(makePt(2025, 7, 13, 15))).toBe(true);
  });
});

describe("getWindowStatus", () => {
  it("returns open=true during weekday open window", () => {
    expect(getWindowStatus(makePt(2025, 7, 15, 20)).open).toBe(true);
  });
  it("returns open=false during weekday closed window", () => {
    expect(getWindowStatus(makePt(2025, 7, 15, 10)).open).toBe(false);
  });
  it("opensAt is in the future when window is closed", () => {
    const now = makePt(2025, 7, 15, 10);
    const s = getWindowStatus(now);
    expect(s.open).toBe(false);
    expect(s.opensAt.getTime()).toBeGreaterThan(now.getTime());
  });
  it("closesAt is in the future when window is open", () => {
    const now = makePt(2025, 7, 15, 20);
    const s = getWindowStatus(now);
    expect(s.open).toBe(true);
    expect(s.closesAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("Friday 11 PM PT → closesAt is Saturday 3 AM PT (weekend close)", () => {
    const now = makePt(2025, 7, 11, 23);
    const s = getWindowStatus(now);
    expect(s.open).toBe(true);
    // Saturday 3 AM PT = 2025-07-12 10:00 UTC (PDT)
    expect(s.closesAt.getTime()).toBe(Date.UTC(2025, 6, 12, 10, 0, 0, 0));
  });

  it("Saturday 4 AM PT (closed) → opensAt is Saturday 3 PM PT same day", () => {
    const now = makePt(2025, 7, 12, 4);
    const s = getWindowStatus(now);
    expect(s.open).toBe(false);
    // Saturday 3 PM PT = 2025-07-12 22:00 UTC
    expect(s.opensAt.getTime()).toBe(Date.UTC(2025, 6, 12, 22, 0, 0, 0));
  });

  it("Saturday 8 PM PT → closesAt is Sunday 3 AM PT (weekend close)", () => {
    const now = makePt(2025, 7, 12, 20);
    const s = getWindowStatus(now);
    expect(s.open).toBe(true);
    // Sunday 3 AM PT = 2025-07-13 10:00 UTC
    expect(s.closesAt.getTime()).toBe(Date.UTC(2025, 6, 13, 10, 0, 0, 0));
  });

  it("Sunday 8 PM PT → closesAt is Monday 6 AM PT (weekday close)", () => {
    const now = makePt(2025, 7, 13, 20);
    const s = getWindowStatus(now);
    expect(s.open).toBe(true);
    // Monday 6 AM PT = 2025-07-14 13:00 UTC
    expect(s.closesAt.getTime()).toBe(Date.UTC(2025, 6, 14, 13, 0, 0, 0));
  });
});

describe("formatWindowBoundary", () => {
  it("returns strings for PT, ET, IST", () => {
    const d = makePt(2025, 7, 12, 15); // Saturday 3 PM PT
    const f = formatWindowBoundary(d);
    expect(typeof f.pt).toBe("string");
    expect(typeof f.et).toBe("string");
    expect(typeof f.ist).toBe("string");
    expect(f.pt.length).toBeGreaterThan(0);
    expect(f.et.length).toBeGreaterThan(0);
    expect(f.ist.length).toBeGreaterThan(0);
  });
});

describe("constants", () => {
  it("exports correct window hours", () => {
    expect(WINDOW_OPEN_HOUR).toBe(15);
    expect(WEEKDAY_CLOSE_HOUR).toBe(6);
    expect(WEEKEND_CLOSE_HOUR).toBe(3);
  });
});

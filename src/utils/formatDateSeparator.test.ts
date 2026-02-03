import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isToday,
  isYesterday,
  isWithinWeek,
  getVietnameseDayName,
  formatDateDDMMYYYY,
  formatDateSeparator,
} from "./formatDateSeparator";

describe("formatDateSeparator utilities", () => {
  let mockNow: Date;

  beforeEach(() => {
    // Mock current date: 2026-02-02 10:30:00
    mockNow = new Date("2026-02-02T10:30:00.000Z");
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isToday", () => {
    it("returns true for today", () => {
      const today = new Date("2026-02-02T15:00:00.000Z");
      expect(isToday(today)).toBe(true);
    });

    it("returns false for yesterday", () => {
      const yesterday = new Date("2026-02-01T15:00:00.000Z");
      expect(isToday(yesterday)).toBe(false);
    });

    it("returns false for tomorrow", () => {
      const tomorrow = new Date("2026-02-03T15:00:00.000Z");
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe("isYesterday", () => {
    it("returns true for yesterday", () => {
      const yesterday = new Date("2026-02-01T15:00:00.000Z");
      expect(isYesterday(yesterday)).toBe(true);
    });

    it("returns false for today", () => {
      const today = new Date("2026-02-02T15:00:00.000Z");
      expect(isYesterday(today)).toBe(false);
    });

    it("returns false for 2 days ago", () => {
      const twoDaysAgo = new Date("2026-01-31T15:00:00.000Z");
      expect(isYesterday(twoDaysAgo)).toBe(false);
    });
  });

  describe("isWithinWeek", () => {
    it("returns true for 3 days ago", () => {
      const threeDaysAgo = new Date("2026-01-30T15:00:00.000Z");
      expect(isWithinWeek(threeDaysAgo)).toBe(true);
    });

    it("returns true for 6 days ago", () => {
      const sixDaysAgo = new Date("2026-01-27T15:00:00.000Z");
      expect(isWithinWeek(sixDaysAgo)).toBe(true);
    });

    it("returns false for today", () => {
      const today = new Date("2026-02-02T15:00:00.000Z");
      expect(isWithinWeek(today)).toBe(false);
    });

    it("returns false for yesterday", () => {
      const yesterday = new Date("2026-02-01T15:00:00.000Z");
      expect(isWithinWeek(yesterday)).toBe(false);
    });

    it("returns false for 8 days ago", () => {
      const eightDaysAgo = new Date("2026-01-25T15:00:00.000Z");
      expect(isWithinWeek(eightDaysAgo)).toBe(false);
    });
  });

  describe("getVietnameseDayName", () => {
    it("returns 'Chủ nhật' for Sunday", () => {
      const sunday = new Date("2026-02-01T00:00:00.000Z"); // Sunday
      expect(getVietnameseDayName(sunday)).toBe("Chủ nhật");
    });

    it("returns 'Thứ hai' for Monday", () => {
      const monday = new Date("2026-02-02T00:00:00.000Z"); // Monday
      expect(getVietnameseDayName(monday)).toBe("Thứ hai");
    });

    it("returns 'Thứ năm' for Thursday", () => {
      const thursday = new Date("2026-01-29T00:00:00.000Z"); // Thursday
      expect(getVietnameseDayName(thursday)).toBe("Thứ năm");
    });

    it("returns 'Thứ bảy' for Saturday", () => {
      const saturday = new Date("2026-01-31T00:00:00.000Z"); // Saturday
      expect(getVietnameseDayName(saturday)).toBe("Thứ bảy");
    });
  });

  describe("formatDateDDMMYYYY", () => {
    it("formats date correctly with leading zeros", () => {
      const date = new Date("2026-02-01T00:00:00.000Z");
      expect(formatDateDDMMYYYY(date)).toBe("01/02/2026");
    });

    it("formats date correctly without leading zeros needed", () => {
      const date = new Date("2026-12-25T00:00:00.000Z");
      expect(formatDateDDMMYYYY(date)).toBe("25/12/2026");
    });

    it("formats single digit day and month with leading zeros", () => {
      const date = new Date("2026-03-05T00:00:00.000Z");
      expect(formatDateDDMMYYYY(date)).toBe("05/03/2026");
    });
  });

  describe("formatDateSeparator", () => {
    it("returns 'Hôm nay' for today", () => {
      const today = "2026-02-02T15:00:00.000Z";
      expect(formatDateSeparator(today)).toBe("Hôm nay");
    });

    it("returns 'Hôm qua' for yesterday", () => {
      const yesterday = "2026-02-01T15:00:00.000Z";
      expect(formatDateSeparator(yesterday)).toBe("Hôm qua");
    });

    it("returns weekday + date for 3 days ago (within week)", () => {
      const threeDaysAgo = "2026-01-30T15:00:00.000Z"; // Friday
      expect(formatDateSeparator(threeDaysAgo)).toBe("Thứ sáu, 30/01/2026");
    });

    it("returns weekday + date for 6 days ago (within week)", () => {
      const sixDaysAgo = "2026-01-27T15:00:00.000Z"; // Tuesday
      expect(formatDateSeparator(sixDaysAgo)).toBe("Thứ ba, 27/01/2026");
    });

    it("returns only date for 8 days ago (older than week)", () => {
      const eightDaysAgo = "2026-01-25T15:00:00.000Z";
      expect(formatDateSeparator(eightDaysAgo)).toBe("25/01/2026");
    });

    it("returns only date for last month", () => {
      const lastMonth = "2026-01-15T15:00:00.000Z";
      expect(formatDateSeparator(lastMonth)).toBe("15/01/2026");
    });

    it("returns only date for last year", () => {
      const lastYear = "2025-12-25T15:00:00.000Z";
      expect(formatDateSeparator(lastYear)).toBe("25/12/2025");
    });

    it("handles midnight boundary correctly", () => {
      // Mock: 2026-02-02 00:00:01 (just after midnight)
      vi.setSystemTime(new Date("2026-02-02T00:00:01.000Z"));

      // Create yesterday's date in local time
      const yesterday = new Date("2026-02-02T00:00:01.000Z");
      yesterday.setDate(yesterday.getDate() - 1);
      const lastMinuteYesterday = yesterday.toISOString();

      expect(formatDateSeparator(lastMinuteYesterday)).toBe("Hôm qua");
    });
  });
});

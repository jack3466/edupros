import { describe, it, expect } from "vitest";
import { calculateAttendanceStats } from "@/lib/services/attendance.service";

describe("Attendance Calculation Engine", () => {
  it("should calculate 100% attendance correctly", () => {
    const stats = calculateAttendanceStats(10, 10, 75);
    expect(stats.percentage).toBe(100);
    expect(stats.isShortage).toBe(false);
    expect(stats.sessionsNeededForThreshold).toBe(0);
  });

  it("should correctly detect shortage when below 75%", () => {
    const stats = calculateAttendanceStats(6, 10, 75);
    expect(stats.percentage).toBe(60);
    expect(stats.isShortage).toBe(true);
    expect(stats.sessionsNeededForThreshold).toBe(6);
  });

  it("should handle 0 total classes gracefully", () => {
    const stats = calculateAttendanceStats(0, 0, 75);
    expect(stats.percentage).toBe(100);
    expect(stats.isShortage).toBe(false);
    expect(stats.sessionsNeededForThreshold).toBe(0);
  });

  it("should detect exact threshold boundary", () => {
    const stats = calculateAttendanceStats(15, 20, 75);
    expect(stats.percentage).toBe(75);
    expect(stats.isShortage).toBe(false);
    expect(stats.sessionsNeededForThreshold).toBe(0);
  });
});

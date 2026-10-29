export interface AttendanceSummary {
  totalSessions: number;
  attendedSessions: number;
  percentage: number;
  isShortage: boolean;
  sessionsNeededForThreshold: number;
}

/**
 * Pure calculation engine for student attendance statistics and shortage threshold
 */
export function calculateAttendanceStats(
  attended: number,
  total: number,
  threshold: number = 75.0
): AttendanceSummary {
  if (total === 0) {
    return {
      totalSessions: 0,
      attendedSessions: 0,
      percentage: 100.0,
      isShortage: false,
      sessionsNeededForThreshold: 0,
    };
  }

  const percentage = Math.round((attended / total) * 10000) / 100;
  const isShortage = percentage < threshold;

  let sessionsNeededForThreshold = 0;
  if (isShortage) {
    const needed = Math.ceil(
      (threshold * total - 100 * attended) / (100 - threshold)
    );
    sessionsNeededForThreshold = needed > 0 ? needed : 0;
  }

  return {
    totalSessions: total,
    attendedSessions: attended,
    percentage,
    isShortage,
    sessionsNeededForThreshold,
  };
}

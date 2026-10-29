import { describe, it, expect } from "vitest";

export interface AttendanceRawEntry {
  email: string;
  name: string;
  status: "PRESENT" | "ABSENT";
}

export function processSpreadsheetAttendanceRows(
  rows: AttendanceRawEntry[],
  enrolledStudentEmails: string[],
  existingSessionKeys: Set<string>,
  sessionDateKey: string
) {
  // Scenario 4: Prevent duplicate imports for the exact same session key
  if (existingSessionKeys.has(sessionDateKey)) {
    return {
      status: "DUPLICATE_REJECTED",
      message: "An attendance session for this date and subject has already been processed.",
      matched: [],
      unmatched: [],
    };
  }

  const matched: AttendanceRawEntry[] = [];
  const unmatched: { email: string; reason: string }[] = [];

  // Scenario 5: Detect unmatched student emails
  for (const row of rows) {
    const normalizedEmail = row.email.trim().toLowerCase();
    if (enrolledStudentEmails.includes(normalizedEmail)) {
      matched.push({
        ...row,
        email: normalizedEmail,
      });
    } else {
      unmatched.push({
        email: row.email,
        reason: "Email does not match any student enrolled in this cohort.",
      });
    }
  }

  // Record session key to prevent duplicates
  existingSessionKeys.add(sessionDateKey);

  return {
    status: "PROCESSED",
    matched,
    unmatched,
    totalRows: rows.length,
    matchedCount: matched.length,
    unmatchedCount: unmatched.length,
  };
}

describe("Attendance Integration Engine & Duplicate Prevention", () => {
  const enrolledEmails = [
    "student.aarav@apex.edu",
    "student.diya@apex.edu",
    "student.rohan@apex.edu",
  ];

  it("Scenario 5: Reports unmatched student emails when processing spreadsheet data", () => {
    const rawRows: AttendanceRawEntry[] = [
      { email: "student.aarav@apex.edu", name: "Aarav", status: "PRESENT" },
      { email: "stranger.unknown@gmail.com", name: "Stranger", status: "PRESENT" }, // Unmatched!
      { email: "student.diya@apex.edu", name: "Diya", status: "PRESENT" },
    ];

    const sessionKeys = new Set<string>();
    const result = processSpreadsheetAttendanceRows(
      rawRows,
      enrolledEmails,
      sessionKeys,
      "session-2025-10-01-cs301"
    );

    expect(result.status).toBe("PROCESSED");
    expect(result.matchedCount).toBe(2);
    expect(result.unmatchedCount).toBe(1);
    expect(result.unmatched[0].email).toBe("stranger.unknown@gmail.com");
    expect(result.unmatched[0].reason).toContain("does not match any student");
  });

  it("Scenario 4: Strictly rejects duplicate attendance session imports", () => {
    const rawRows: AttendanceRawEntry[] = [
      { email: "student.aarav@apex.edu", name: "Aarav", status: "PRESENT" },
    ];

    const sessionKeys = new Set<string>(["session-2025-10-01-cs301"]); // Already logged!
    const result = processSpreadsheetAttendanceRows(
      rawRows,
      enrolledEmails,
      sessionKeys,
      "session-2025-10-01-cs301"
    );

    expect(result.status).toBe("DUPLICATE_REJECTED");
    expect(result.message).toContain("already been processed");
  });

  it("Scenario 9: Allows clean retry after correcting unmatched records without duplicates", () => {
    const sessionKeys = new Set<string>();

    // Initial batch has unmatched email
    const batch1: AttendanceRawEntry[] = [
      { email: "student.aarav@apex.edu", name: "Aarav", status: "PRESENT" },
      { email: "typo.email@apex.edu", name: "Rohan", status: "PRESENT" },
    ];

    const res1 = processSpreadsheetAttendanceRows(
      batch1,
      enrolledEmails,
      sessionKeys,
      "session-attempt-1"
    );
    expect(res1.unmatchedCount).toBe(1);

    // Corrected retry with proper email
    const correctedBatch: AttendanceRawEntry[] = [
      { email: "student.rohan@apex.edu", name: "Rohan", status: "PRESENT" },
    ];

    const res2 = processSpreadsheetAttendanceRows(
      correctedBatch,
      enrolledEmails,
      sessionKeys,
      "session-attempt-2"
    );
    expect(res2.status).toBe("PROCESSED");
    expect(res2.matchedCount).toBe(1);
    expect(res2.unmatchedCount).toBe(0);
  });
});

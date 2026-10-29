import { describe, it, expect } from "vitest";

export type MarkSubmissionState = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PUBLISHED";

export interface StateTransitionResult {
  allowed: boolean;
  newState?: MarkSubmissionState;
  reason?: string;
}

export function transitionMarkStatus(
  current: MarkSubmissionState,
  action: "SUBMIT" | "APPROVE" | "REJECT" | "PUBLISH" | "EDIT",
  userRole: "TEACHER" | "INSTITUTION_ADMIN" | "SUPER_ADMIN" | "STUDENT",
  rejectionReason?: string
): StateTransitionResult {
  if (userRole === "STUDENT") {
    return { allowed: false, reason: "Students cannot modify examination workflows." };
  }

  switch (action) {
    case "EDIT":
      if (current === "DRAFT" || current === "REJECTED") {
        return { allowed: true, newState: "DRAFT" };
      }
      return { allowed: false, reason: "Cannot edit submitted or approved marks directly." };

    case "SUBMIT":
      if (userRole !== "TEACHER" && userRole !== "INSTITUTION_ADMIN") {
        return { allowed: false, reason: "Only teachers or admins can submit marks." };
      }
      if (current === "DRAFT" || current === "REJECTED") {
        return { allowed: true, newState: "SUBMITTED" };
      }
      return { allowed: false, reason: "Marks are already submitted or finalized." };

    case "APPROVE":
      if (userRole !== "INSTITUTION_ADMIN" && userRole !== "SUPER_ADMIN") {
        return { allowed: false, reason: "Only institution administrators can approve marks." };
      }
      if (current === "SUBMITTED") {
        return { allowed: true, newState: "APPROVED" };
      }
      return { allowed: false, reason: "Can only approve marks in SUBMITTED state." };

    case "REJECT":
      if (userRole !== "INSTITUTION_ADMIN" && userRole !== "SUPER_ADMIN") {
        return { allowed: false, reason: "Only institution administrators can reject marks." };
      }
      if (current !== "SUBMITTED") {
        return { allowed: false, reason: "Can only reject marks that are in SUBMITTED state." };
      }
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        return { allowed: false, reason: "Rejection requires an explicit explanatory reason." };
      }
      return { allowed: true, newState: "REJECTED" };

    case "PUBLISH":
      if (userRole !== "INSTITUTION_ADMIN" && userRole !== "SUPER_ADMIN") {
        return { allowed: false, reason: "Only administrators can publish examination results." };
      }
      if (current === "APPROVED") {
        return { allowed: true, newState: "PUBLISHED" };
      }
      return { allowed: false, reason: "Only approved marks can be published to students." };

    default:
      return { allowed: false, reason: "Unknown action." };
  }
}

describe("Examination Mark Approval Workflow State Machine", () => {
  it("allows teacher to transition DRAFT -> SUBMITTED", () => {
    const res = transitionMarkStatus("DRAFT", "SUBMIT", "TEACHER");
    expect(res.allowed).toBe(true);
    expect(res.newState).toBe("SUBMITTED");
  });

  it("prevents teacher from self-approving submitted marks", () => {
    const res = transitionMarkStatus("SUBMITTED", "APPROVE", "TEACHER");
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Only institution administrators can approve");
  });

  it("allows administrator to approve SUBMITTED marks", () => {
    const res = transitionMarkStatus("SUBMITTED", "APPROVE", "INSTITUTION_ADMIN");
    expect(res.allowed).toBe(true);
    expect(res.newState).toBe("APPROVED");
  });

  it("requires rejection reason when administrator rejects submission", () => {
    const withoutReason = transitionMarkStatus("SUBMITTED", "REJECT", "INSTITUTION_ADMIN", "");
    expect(withoutReason.allowed).toBe(false);
    expect(withoutReason.reason).toContain("requires an explicit explanatory reason");

    const withReason = transitionMarkStatus(
      "SUBMITTED",
      "REJECT",
      "INSTITUTION_ADMIN",
      "Marks exceed 100 on Q3."
    );
    expect(withReason.allowed).toBe(true);
    expect(withReason.newState).toBe("REJECTED");
  });

  it("prevents publishing unapproved marks to students", () => {
    const res = transitionMarkStatus("SUBMITTED", "PUBLISH", "INSTITUTION_ADMIN");
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Only approved marks can be published");
  });

  it("allows publishing approved marks", () => {
    const res = transitionMarkStatus("APPROVED", "PUBLISH", "INSTITUTION_ADMIN");
    expect(res.allowed).toBe(true);
    expect(res.newState).toBe("PUBLISHED");
  });

  it("strictly forbids students from mutating mark states", () => {
    const res = transitionMarkStatus("DRAFT", "SUBMIT", "STUDENT");
    expect(res.allowed).toBe(false);
  });
});

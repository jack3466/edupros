import { describe, it, expect } from "vitest";
import { getRoleDashboardUrl, DEMO_USERS } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";

describe("Role-Based Redirection & Access Control Guards", () => {
  it("redirects SUPER_ADMIN to /platform/dashboard", () => {
    expect(getRoleDashboardUrl(UserRole.SUPER_ADMIN)).toBe("/platform/dashboard");
  });

  it("redirects INSTITUTION_ADMIN to /institution/dashboard", () => {
    expect(getRoleDashboardUrl(UserRole.INSTITUTION_ADMIN)).toBe("/institution/dashboard");
  });

  it("redirects TEACHER to /teacher/dashboard", () => {
    expect(getRoleDashboardUrl(UserRole.TEACHER)).toBe("/teacher/dashboard");
  });

  it("redirects STUDENT to /student/dashboard", () => {
    expect(getRoleDashboardUrl(UserRole.STUDENT)).toBe("/student/dashboard");
  });

  it("has valid seeded demo users for all 4 roles", () => {
    expect(DEMO_USERS.SUPER_ADMIN.email).toBe("superadmin@edupros.io");
    expect(DEMO_USERS.INSTITUTION_ADMIN.email).toBe("admin@apex.edu");
    expect(DEMO_USERS.TEACHER.email).toBe("prof.sharma@apex.edu");
    expect(DEMO_USERS.STUDENT.email).toBe("student.aarav@apex.edu");
  });
});

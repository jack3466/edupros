import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole, MembershipStatus } from "@prisma/client";

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId?: string;
  institutionName?: string;
  isSuperAdmin: boolean;
}

export const SESSION_COOKIE_NAME = "edupros_session";

// Demo accounts seeded in prisma/seed.ts for instant role testing
export const DEMO_USERS = {
  SUPER_ADMIN: {
    email: "superadmin@edupros.io",
    name: "Alexander Vance",
    role: "SUPER_ADMIN" as UserRole,
  },
  INSTITUTION_ADMIN: {
    email: "admin@apex.edu",
    name: "Dr. Eleanor Vance",
    role: "INSTITUTION_ADMIN" as UserRole,
  },
  TEACHER: {
    email: "prof.sharma@apex.edu",
    name: "Prof. Rajesh Sharma",
    role: "TEACHER" as UserRole,
  },
  STUDENT: {
    email: "student.aarav@apex.edu",
    name: "Aarav Mehta",
    role: "STUDENT" as UserRole,
  },
};

/**
 * Get the currently logged-in user session on the server side
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    // Default to Super Admin in local dev when no session exists and mock auth is enabled
    if (process.env.ENABLE_MOCK_AUTH === "true" && process.env.NODE_ENV === "development") {
      // Return default super admin or return null if not logged in
      return null;
    }
    return null;
  }

  try {
    const parsed = JSON.parse(sessionCookie) as AuthSession;
    
    // Verify user still exists and is active in database
    const dbUser = await prisma.user.findUnique({
      where: { id: parsed.userId },
      include: {
        memberships: {
          include: {
            institution: true,
          },
        },
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    // If super admin
    if (dbUser.isSuperAdmin) {
      return {
        userId: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: UserRole.SUPER_ADMIN,
        isSuperAdmin: true,
        institutionId: parsed.institutionId || dbUser.memberships[0]?.institutionId,
        institutionName: dbUser.memberships[0]?.institution?.name,
      };
    }

    // Find active membership matching role or institution
    const activeMembership = dbUser.memberships.find(
      (m) =>
        m.status === MembershipStatus.ACTIVE &&
        (!parsed.institutionId || m.institutionId === parsed.institutionId) &&
        m.role === parsed.role
    ) || dbUser.memberships.find((m) => m.status === MembershipStatus.ACTIVE);

    if (!activeMembership) {
      return null;
    }

    return {
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: activeMembership.role,
      institutionId: activeMembership.institutionId,
      institutionName: activeMembership.institution.name,
      isSuperAdmin: false,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the correct dashboard route for a given user role
 */
export function getRoleDashboardUrl(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "/platform/dashboard";
    case UserRole.INSTITUTION_ADMIN:
      return "/institution/dashboard";
    case UserRole.TEACHER:
      return "/teacher/dashboard";
    case UserRole.STUDENT:
      return "/student/dashboard";
    default:
      return "/login";
  }
}

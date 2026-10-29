"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getRoleDashboardUrl, DEMO_USERS, AuthSession } from "@/lib/auth/session";
import { UserRole, MembershipStatus } from "@prisma/client";
import { AuditService } from "@/lib/services/audit.service";

/**
 * Log in using email and optional password
 */
export async function loginWithEmail(formData: FormData): Promise<void> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email) {
    redirect("/login?error=email_required");
  }

  let role: UserRole = UserRole.STUDENT;
  let institutionId: string | undefined = undefined;
  let institutionName: string | undefined = undefined;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          include: { institution: true },
        },
      },
    });

    if (!user) {
      redirect("/login?error=user_not_found");
    }

    if (!user.isActive) {
      redirect("/login?error=account_deactivated");
    }

    if (user.isSuperAdmin) {
      role = UserRole.SUPER_ADMIN;
    } else if (user.memberships.length > 0) {
      const primaryMembership = user.memberships[0];
      role = primaryMembership.role;
      institutionId = primaryMembership.institutionId;
      institutionName = primaryMembership.institution.name;
    }

    const sessionData: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role,
      institutionId,
      institutionName,
      isSuperAdmin: user.isSuperAdmin,
    };

    cookies().set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await AuditService.record({
      institutionId,
      userId: user.id,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.id,
      metadata: { role, email: user.email },
    });
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Login error:", error);
    redirect("/login?error=auth_failed");
  }

  redirect(getRoleDashboardUrl(role));
}

/**
 * One-click demo role login for swift testing
 */
export async function switchDemoRole(role: UserRole): Promise<void> {
  const target = DEMO_USERS[role];
  if (!target) {
    throw new Error("Invalid demo role selected.");
  }

  let user = await prisma.user.findUnique({
    where: { email: target.email },
    include: {
      memberships: {
        include: { institution: true },
      },
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: target.email,
        name: target.name,
        isSuperAdmin: role === UserRole.SUPER_ADMIN,
        isActive: true,
      },
      include: {
        memberships: {
          include: { institution: true },
        },
      },
    });
  }

  const primaryMembership = user.memberships[0];

  const sessionData: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role,
    institutionId: primaryMembership?.institutionId,
    institutionName: primaryMembership?.institution?.name || (role === UserRole.SUPER_ADMIN ? "Global Platform" : "Apex Institute of Technology"),
    isSuperAdmin: user.isSuperAdmin,
  };

  cookies().set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(getRoleDashboardUrl(role));
}

/**
 * Log out user and clear cookie
 */
export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

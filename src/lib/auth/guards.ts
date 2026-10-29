import { redirect } from "next/navigation";
import { getSession, AuthSession } from "./session";
import { UserRole } from "@prisma/client";

/**
 * Ensures user is authenticated. If not, redirects to /login
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Ensures current user is a Platform Super Administrator
 */
export async function requireSuperAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.role !== UserRole.SUPER_ADMIN && !session.isSuperAdmin) {
    redirect("/unauthorized?reason=super_admin_required");
  }
  return session;
}

/**
 * Ensures user is an Institution Admin for the specified institution
 */
export async function requireInstitutionAdmin(
  institutionId?: string
): Promise<AuthSession> {
  const session = await requireAuth();

  // Super Admins have global administrative privilege
  if (session.isSuperAdmin || session.role === UserRole.SUPER_ADMIN) {
    return session;
  }

  if (session.role !== UserRole.INSTITUTION_ADMIN) {
    redirect("/unauthorized?reason=institution_admin_required");
  }

  if (institutionId && session.institutionId && session.institutionId !== institutionId) {
    redirect("/unauthorized?reason=cross_tenant_access_denied");
  }

  return session;
}

/**
 * Ensures user is a Teacher
 */
export async function requireTeacher(
  institutionId?: string
): Promise<AuthSession> {
  const session = await requireAuth();

  if (session.isSuperAdmin || session.role === UserRole.SUPER_ADMIN) {
    return session;
  }

  if (session.role !== UserRole.TEACHER && session.role !== UserRole.INSTITUTION_ADMIN) {
    redirect("/unauthorized?reason=teacher_required");
  }

  if (institutionId && session.institutionId && session.institutionId !== institutionId) {
    redirect("/unauthorized?reason=cross_tenant_access_denied");
  }

  return session;
}

/**
 * Ensures user is a Student
 */
export async function requireStudent(
  institutionId?: string
): Promise<AuthSession> {
  const session = await requireAuth();

  if (session.role !== UserRole.STUDENT) {
    redirect("/unauthorized?reason=student_required");
  }

  if (institutionId && session.institutionId && session.institutionId !== institutionId) {
    redirect("/unauthorized?reason=cross_tenant_access_denied");
  }

  return session;
}

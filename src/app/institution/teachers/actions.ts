"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { UserRole, MembershipStatus } from "@prisma/client";
import { z } from "zod";

const createTeacherSchema = z.object({
  name: z.string().min(2, "Teacher name required."),
  email: z.string().email("Valid institutional email required."),
  employeeId: z.string().min(1, "Employee ID required.").toUpperCase(),
  departmentId: z.string().uuid("Please select a department."),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
});

export async function createTeacherAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/institution/teachers?error=no_institution");
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    employeeId: formData.get("employeeId"),
    departmentId: formData.get("departmentId"),
    qualification: formData.get("qualification"),
    specialization: formData.get("specialization"),
  };

  const parsed = createTeacherSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/institution/teachers?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { name, email, employeeId, departmentId, qualification, specialization } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            name,
            isActive: true,
          },
        });
      }

      await tx.userMembership.upsert({
        where: {
          userId_institutionId_role: {
            userId: user.id,
            institutionId,
            role: UserRole.TEACHER,
          },
        },
        update: { status: MembershipStatus.ACTIVE },
        create: {
          userId: user.id,
          institutionId,
          role: UserRole.TEACHER,
          status: MembershipStatus.ACTIVE,
        },
      });

      let profile = await tx.teacherProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        profile = await tx.teacherProfile.create({
          data: {
            userId: user.id,
            employeeId,
            departmentId,
            qualification: qualification || null,
            specialization: specialization || null,
          },
        });
      }
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "FACULTY_MEMBER_ONBOARDED",
      entityType: "TeacherProfile",
      metadata: { name, email, employeeId, departmentId },
    });

    revalidatePath("/institution/teachers");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to onboard teacher:", error);
    redirect("/institution/teachers?error=onboarding_failed");
  }

  redirect("/institution/teachers");
}

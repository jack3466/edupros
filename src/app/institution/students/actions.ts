"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { UserRole, MembershipStatus } from "@prisma/client";
import { z } from "zod";

const createStudentSchema = z.object({
  name: z.string().min(2, "Full name required."),
  email: z.string().email("Valid institutional email required."),
  rollNumber: z.string().min(1, "Roll number required.").toUpperCase(),
  classId: z.string().uuid("Please select a class cohort."),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
});

export async function createStudentAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/institution/students?error=no_institution");
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    rollNumber: formData.get("rollNumber"),
    classId: formData.get("classId"),
    guardianName: formData.get("guardianName"),
    guardianPhone: formData.get("guardianPhone"),
  };

  const parsed = createStudentSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/institution/students?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { name, email, rollNumber, classId, guardianName, guardianPhone } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create or find user
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

      // 2. Create membership
      await tx.userMembership.upsert({
        where: {
          userId_institutionId_role: {
            userId: user.id,
            institutionId,
            role: UserRole.STUDENT,
          },
        },
        update: { status: MembershipStatus.ACTIVE },
        create: {
          userId: user.id,
          institutionId,
          role: UserRole.STUDENT,
          status: MembershipStatus.ACTIVE,
        },
      });

      // 3. Create or update StudentProfile
      let profile = await tx.studentProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        profile = await tx.studentProfile.create({
          data: {
            userId: user.id,
            rollNumber,
            guardianName: guardianName || null,
            guardianPhone: guardianPhone || null,
          },
        });
      }

      // 4. Enroll into class
      await tx.studentEnrollment.upsert({
        where: {
          studentProfileId_classId: {
            studentProfileId: profile.id,
            classId,
          },
        },
        update: { isActive: true },
        create: {
          studentProfileId: profile.id,
          classId,
          isActive: true,
        },
      });
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "STUDENT_ENROLLED",
      entityType: "StudentProfile",
      metadata: { name, email, rollNumber, classId },
    });

    revalidatePath("/institution/students");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to enroll student:", error);
    redirect("/institution/students?error=enrollment_failed");
  }

  redirect("/institution/students");
}

export interface BulkStudentRow {
  name: string;
  email: string;
  rollNumber: string;
  guardianName?: string;
  guardianPhone?: string;
}

export async function processBulkStudentImport(
  students: BulkStudentRow[],
  classId: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  if (!institutionId) {
    throw new Error("No institution context found.");
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of students) {
    try {
      if (!s.email || !s.name || !s.rollNumber) {
        skipped++;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        let user = await tx.user.findUnique({
          where: { email: s.email.trim().toLowerCase() },
        });

        if (!user) {
          user = await tx.user.create({
            data: {
              email: s.email.trim().toLowerCase(),
              name: s.name.trim(),
              isActive: true,
            },
          });
        }

        await tx.userMembership.upsert({
          where: {
            userId_institutionId_role: {
              userId: user.id,
              institutionId,
              role: UserRole.STUDENT,
            },
          },
          update: { status: MembershipStatus.ACTIVE },
          create: {
            userId: user.id,
            institutionId,
            role: UserRole.STUDENT,
            status: MembershipStatus.ACTIVE,
          },
        });

        let profile = await tx.studentProfile.findUnique({
          where: { userId: user.id },
        });

        if (!profile) {
          profile = await tx.studentProfile.create({
            data: {
              userId: user.id,
              rollNumber: s.rollNumber.trim().toUpperCase(),
              guardianName: s.guardianName?.trim() || null,
              guardianPhone: s.guardianPhone?.trim() || null,
            },
          });
        }

        await tx.studentEnrollment.upsert({
          where: {
            studentProfileId_classId: {
              studentProfileId: profile.id,
              classId,
            },
          },
          update: { isActive: true },
          create: {
            studentProfileId: profile.id,
            classId,
            isActive: true,
          },
        });
      });

      imported++;
    } catch (err) {
      skipped++;
      errors.push(`Failed for ${s.email}: ${(err as Error).message}`);
    }
  }

  await AuditService.record({
    institutionId,
    userId: session.userId,
    action: "STUDENTS_BULK_IMPORTED",
    entityType: "StudentEnrollment",
    metadata: { imported, skipped, classId },
  });

  revalidatePath("/institution/students");
  revalidatePath("/institution/dashboard");

  return { imported, skipped, errors };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { CorrectionStatus, AttendanceStatus } from "@prisma/client";

/**
 * Review student attendance discrepancy / correction request
 */
export async function reviewAttendanceCorrectionAction(
  correctionId: string,
  decision: "APPROVED" | "REJECTED",
  remarks?: string
): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  try {
    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id: correctionId },
      include: { attendanceRecord: true },
    });

    if (!correction) {
      redirect("/institution/attendance?error=correction_not_found");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update correction status
      await tx.attendanceCorrection.update({
        where: { id: correctionId },
        data: {
          status: decision === "APPROVED" ? CorrectionStatus.APPROVED : CorrectionStatus.REJECTED,
          reviewedById: session.userId,
          reviewRemarks: remarks || null,
        },
      });

      // 2. If approved, update the actual AttendanceRecord status
      if (decision === "APPROVED") {
        await tx.attendanceRecord.update({
          where: { id: correction.attendanceRecordId },
          data: {
            status: correction.requestedStatus,
            remarks: `Corrected: ${remarks || "Approved by administrator"}`,
          },
        });
      }
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: `ATTENDANCE_CORRECTION_${decision}`,
      entityType: "AttendanceCorrection",
      entityId: correctionId,
      metadata: { decision, remarks, requestedStatus: correction.requestedStatus },
    });

    revalidatePath("/institution/attendance");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to review attendance correction:", error);
    redirect("/institution/attendance?error=review_failed");
  }

  redirect("/institution/attendance");
}

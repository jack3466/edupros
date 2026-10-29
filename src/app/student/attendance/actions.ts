"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { AttendanceStatus, CorrectionStatus } from "@prisma/client";
import { z } from "zod";

const disputeSchema = z.object({
  attendanceRecordId: z.string().uuid("Attendance record required."),
  reason: z.string().min(5, "Please provide an explanatory reason for the dispute."),
});

export async function submitAttendanceDisputeAction(formData: FormData): Promise<void> {
  const session = await requireStudent();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/student/attendance?error=no_institution");
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    redirect("/student/attendance?error=no_profile");
  }

  const raw = {
    attendanceRecordId: formData.get("attendanceRecordId"),
    reason: formData.get("reason"),
  };

  const parsed = disputeSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/student/attendance?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { attendanceRecordId, reason } = parsed.data;

  try {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceRecordId },
    });

    if (!record || record.studentProfileId !== profile.id) {
      redirect("/student/attendance?error=unauthorized_record");
    }

    const correction = await prisma.attendanceCorrection.create({
      data: {
        institutionId,
        attendanceRecordId,
        requestedById: profile.id,
        previousStatus: record.status,
        requestedStatus: AttendanceStatus.PRESENT,
        reason,
        status: CorrectionStatus.PENDING,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "ATTENDANCE_CORRECTION_REQUESTED",
      entityType: "AttendanceCorrection",
      entityId: correction.id,
      metadata: { reason, recordId: attendanceRecordId },
    });

    revalidatePath("/student/attendance");
    revalidatePath("/institution/attendance");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to submit dispute:", error);
    redirect("/student/attendance?error=dispute_failed");
  }

  redirect("/student/attendance");
}

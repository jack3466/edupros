"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { AttendanceStatus } from "@prisma/client";

export async function recordAttendanceSessionAction(formData: FormData): Promise<void> {
  const session = await requireTeacher();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/teacher/attendance?error=no_institution");
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    redirect("/teacher/attendance?error=no_profile");
  }

  const subjectId = formData.get("subjectId") as string;
  const classId = formData.get("classId") as string;
  const sessionDateStr = formData.get("sessionDate") as string;
  const topicCovered = formData.get("topicCovered") as string;

  if (!subjectId || !classId || !sessionDateStr) {
    redirect("/teacher/attendance/new?error=missing_required_fields");
  }

  const sessionDate = new Date(sessionDateStr);

  // Extract student attendance statuses from formData (keys formatted as `status_${studentProfileId}`)
  const studentKeys = Array.from(formData.keys()).filter((k) => k.startsWith("status_"));

  let presentCount = 0;
  let absentCount = 0;
  const recordsData: { studentProfileId: string; status: AttendanceStatus }[] = [];

  for (const key of studentKeys) {
    const studentProfileId = key.replace("status_", "");
    const statusVal = formData.get(key) as AttendanceStatus;
    const finalStatus = Object.values(AttendanceStatus).includes(statusVal)
      ? statusVal
      : AttendanceStatus.PRESENT;

    if (finalStatus === AttendanceStatus.PRESENT) {
      presentCount++;
    } else {
      absentCount++;
    }

    recordsData.push({
      studentProfileId,
      status: finalStatus,
    });
  }

  try {
    const attendanceSession = await prisma.$transaction(async (tx) => {
      const sess = await tx.attendanceSession.create({
        data: {
          institutionId,
          classId,
          subjectId,
          conductedById: profile.id,
          sessionDate,
          topicCovered: topicCovered || null,
          totalStudents: recordsData.length,
          presentCount,
          absentCount,
          records: {
            create: recordsData.map((r) => ({
              studentProfileId: r.studentProfileId,
              status: r.status,
              durationMinutes: r.status === AttendanceStatus.PRESENT ? 60 : 0,
            })),
          },
        },
      });

      return sess;
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "ATTENDANCE_SESSION_LOGGED",
      entityType: "AttendanceSession",
      entityId: attendanceSession.id,
      metadata: { subjectId, classId, presentCount, absentCount },
    });

    revalidatePath("/teacher/attendance");
    revalidatePath("/teacher/dashboard");
    revalidatePath("/institution/attendance");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to record attendance session:", error);
    redirect("/teacher/attendance/new?error=save_failed");
  }

  redirect("/teacher/attendance");
}

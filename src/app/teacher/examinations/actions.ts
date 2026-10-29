"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { MarkSubmissionStatus } from "@prisma/client";

export async function saveOrSubmitMarksAction(formData: FormData): Promise<void> {
  const session = await requireTeacher();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/teacher/examinations?error=no_institution");
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    redirect("/teacher/examinations?error=no_profile");
  }

  const examinationSubjectId = formData.get("examinationSubjectId") as string;
  const submissionAction = formData.get("submissionAction") as string; // "DRAFT" or "SUBMIT"
  const submissionNotes = formData.get("submissionNotes") as string;

  if (!examinationSubjectId) {
    redirect("/teacher/examinations?error=no_exam_subject");
  }

  const targetStatus =
    submissionAction === "SUBMIT"
      ? MarkSubmissionStatus.SUBMITTED
      : MarkSubmissionStatus.DRAFT;

  // Extract student marks (keys: `marks_${studentProfileId}`)
  const markKeys = Array.from(formData.keys()).filter((k) => k.startsWith("marks_"));
  const marksData: { studentProfileId: string; marksObtained: number; isAbsent: boolean }[] = [];

  for (const key of markKeys) {
    const studentProfileId = key.replace("marks_", "");
    const val = formData.get(key) as string;
    const isAbsent = formData.get(`absent_${studentProfileId}`) === "on";

    const marksObtained = isAbsent ? 0 : parseFloat(val) || 0;
    marksData.push({
      studentProfileId,
      marksObtained,
      isAbsent,
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Find existing submission for this teacher & exam subject
      let submission = await tx.markSubmission.findFirst({
        where: {
          examinationSubjectId,
          submittedById: profile.id,
        },
      });

      if (!submission) {
        submission = await tx.markSubmission.create({
          data: {
            examinationSubjectId,
            submittedById: profile.id,
            version: 1,
            status: targetStatus,
            submissionNotes: submissionNotes || null,
            submittedAt: targetStatus === MarkSubmissionStatus.SUBMITTED ? new Date() : null,
          },
        });
      } else {
        // If updating an existing rejected submission, increment version
        const newVersion =
          submission.status === MarkSubmissionStatus.REJECTED
            ? submission.version + 1
            : submission.version;

        submission = await tx.markSubmission.update({
          where: { id: submission.id },
          data: {
            version: newVersion,
            status: targetStatus,
            submissionNotes: submissionNotes || null,
            submittedAt: targetStatus === MarkSubmissionStatus.SUBMITTED ? new Date() : null,
          },
        });
      }

      // Upsert marks
      for (const m of marksData) {
        await tx.examMark.upsert({
          where: {
            examinationSubjectId_studentProfileId: {
              examinationSubjectId,
              studentProfileId: m.studentProfileId,
            },
          },
          update: {
            marksObtained: m.marksObtained,
            isAbsent: m.isAbsent,
            submissionId: submission.id,
          },
          create: {
            examinationSubjectId,
            studentProfileId: m.studentProfileId,
            marksObtained: m.marksObtained,
            isAbsent: m.isAbsent,
            submissionId: submission.id,
          },
        });
      }
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: `EXAM_MARKS_${targetStatus}`,
      entityType: "MarkSubmission",
      entityId: examinationSubjectId,
      metadata: { targetStatus, count: marksData.length },
    });

    revalidatePath("/teacher/examinations");
    revalidatePath("/institution/examinations");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to save or submit marks:", error);
    redirect("/teacher/examinations?error=save_marks_failed");
  }

  redirect("/teacher/examinations");
}

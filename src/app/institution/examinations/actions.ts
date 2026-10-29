"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { ExamType, MarkSubmissionStatus } from "@prisma/client";
import { z } from "zod";

const createExamSchema = z.object({
  name: z.string().min(2, "Examination name required."),
  type: z.nativeEnum(ExamType).default(ExamType.MIDTERM),
  semesterId: z.string().uuid("Semester selection required."),
  startDate: z.string().min(1, "Start date required."),
  endDate: z.string().min(1, "End date required."),
  subjectId: z.string().uuid("Subject selection required."),
  maxMarks: z.coerce.number().min(1).default(100.0),
  passMarks: z.coerce.number().min(1).default(40.0),
});

export async function createExaminationAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/institution/examinations?error=no_institution");
  }

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    semesterId: formData.get("semesterId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    subjectId: formData.get("subjectId"),
    maxMarks: formData.get("maxMarks") || 100.0,
    passMarks: formData.get("passMarks") || 40.0,
  };

  const parsed = createExamSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/institution/examinations?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { name, type, semesterId, startDate, endDate, subjectId, maxMarks, passMarks } = parsed.data;

  try {
    const exam = await prisma.examination.create({
      data: {
        institutionId,
        semesterId,
        name,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPublished: false,
        subjects: {
          create: {
            subjectId,
            maxMarks,
            passMarks,
          },
        },
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "EXAMINATION_SCHEDULED",
      entityType: "Examination",
      entityId: exam.id,
      metadata: { name, type, subjectId, maxMarks },
    });

    revalidatePath("/institution/examinations");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to create examination:", error);
    redirect("/institution/examinations?error=creation_failed");
  }

  redirect("/institution/examinations");
}

/**
 * Review marks submitted by teacher (APPROVE or REJECT)
 */
export async function reviewMarkSubmissionAction(
  submissionId: string,
  decision: "APPROVED" | "REJECTED",
  rejectionReason?: string
): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  if (decision === "REJECTED" && (!rejectionReason || rejectionReason.trim().length === 0)) {
    redirect("/institution/examinations?error=rejection_reason_required");
  }

  try {
    const newStatus =
      decision === "APPROVED"
        ? MarkSubmissionStatus.APPROVED
        : MarkSubmissionStatus.REJECTED;

    await prisma.$transaction(async (tx) => {
      // 1. Update submission status
      await tx.markSubmission.update({
        where: { id: submissionId },
        data: {
          status: newStatus,
          rejectionReason: decision === "REJECTED" ? rejectionReason : null,
        },
      });

      // 2. Record approval log
      await tx.markApproval.create({
        data: {
          submissionId,
          reviewedById: session.userId,
          decision: newStatus,
          decisionReason: decision === "REJECTED" ? rejectionReason : "Approved by administrator",
        },
      });
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: `EXAM_MARKS_${decision}`,
      entityType: "MarkSubmission",
      entityId: submissionId,
      metadata: { decision, rejectionReason },
    });

    revalidatePath("/institution/examinations");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to review marks:", error);
    redirect("/institution/examinations?error=review_failed");
  }

  redirect("/institution/examinations");
}

/**
 * Toggle examination publish state (making marks visible to students)
 */
export async function togglePublishExaminationAction(
  examinationId: string,
  currentPublished: boolean
): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  try {
    await prisma.examination.update({
      where: { id: examinationId },
      data: { isPublished: !currentPublished },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: !currentPublished ? "EXAMINATION_PUBLISHED" : "EXAMINATION_UNPUBLISHED",
      entityType: "Examination",
      entityId: examinationId,
    });

    revalidatePath("/institution/examinations");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to toggle publish examination:", error);
    redirect("/institution/examinations?error=toggle_publish_failed");
  }

  redirect("/institution/examinations");
}

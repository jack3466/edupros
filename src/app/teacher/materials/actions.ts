"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { z } from "zod";

const createAssignmentSchema = z.object({
  title: z.string().min(2, "Assignment title required."),
  description: z.string().min(5, "Task instructions required."),
  classId: z.string().uuid("Class cohort required."),
  subjectId: z.string().uuid("Course subject required."),
  dueDate: z.string().min(1, "Due date required."),
  maxMarks: z.coerce.number().min(1).default(100.0),
  fileAttachmentUrl: z.string().optional(),
});

export async function createAssignmentAction(formData: FormData): Promise<void> {
  const session = await requireTeacher();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/teacher/materials?error=no_institution");
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    redirect("/teacher/materials?error=no_profile");
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId"),
    dueDate: formData.get("dueDate"),
    maxMarks: formData.get("maxMarks") || 100.0,
    fileAttachmentUrl: formData.get("fileAttachmentUrl") || undefined,
  };

  const parsed = createAssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/teacher/materials?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { title, description, classId, subjectId, dueDate, maxMarks, fileAttachmentUrl } = parsed.data;

  try {
    const assignment = await prisma.assignment.create({
      data: {
        institutionId,
        classId,
        subjectId,
        createdById: profile.id,
        title,
        description,
        dueDate: new Date(dueDate),
        maxMarks,
        fileAttachmentUrl: fileAttachmentUrl || null,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "ASSIGNMENT_CREATED",
      entityType: "Assignment",
      entityId: assignment.id,
      metadata: { title, classId, subjectId, dueDate },
    });

    revalidatePath("/teacher/materials");
    revalidatePath("/student/assignments");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to create assignment:", error);
    redirect("/teacher/materials?error=assignment_creation_failed");
  }

  redirect("/teacher/materials");
}

const uploadMaterialSchema = z.object({
  title: z.string().min(2, "Material title required."),
  description: z.string().optional(),
  classId: z.string().uuid("Class cohort required."),
  subjectId: z.string().uuid("Course subject required."),
  fileUrl: z.string().min(1, "Resource URL or reference required."),
  unitNumber: z.coerce.number().min(1).default(1),
});

export async function uploadStudyMaterialAction(formData: FormData): Promise<void> {
  const session = await requireTeacher();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/teacher/materials?error=no_institution");
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    redirect("/teacher/materials?error=no_profile");
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId"),
    fileUrl: formData.get("fileUrl"),
    unitNumber: formData.get("unitNumber") || 1,
  };

  const parsed = uploadMaterialSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/teacher/materials?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { title, description, classId, subjectId, fileUrl, unitNumber } = parsed.data;

  try {
    const material = await prisma.studyMaterial.create({
      data: {
        institutionId,
        classId,
        subjectId,
        uploadedById: profile.id,
        title,
        description: description || null,
        fileUrl,
        unitNumber,
        isPublished: true,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "STUDY_MATERIAL_PUBLISHED",
      entityType: "StudyMaterial",
      entityId: material.id,
      metadata: { title, classId, subjectId },
    });

    revalidatePath("/teacher/materials");
    revalidatePath("/student/assignments");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to upload study material:", error);
    redirect("/teacher/materials?error=material_upload_failed");
  }

  redirect("/teacher/materials");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { VideoProviderType } from "@prisma/client";
import { extractYouTubeVideoId } from "@/lib/utils";
import { z } from "zod";

const addVideoSchema = z.object({
  title: z.string().min(2, "Video title required."),
  description: z.string().optional(),
  videoUrl: z.string().url("Valid YouTube URL required."),
  classId: z.string().uuid("Class cohort selection required."),
  subjectId: z.string().uuid("Course subject selection required."),
  unitNumber: z.coerce.number().min(1).default(1),
  durationSeconds: z.coerce.number().min(0).default(3600),
});

export async function addRecordedClassAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/institution/videos?error=no_institution");
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    videoUrl: formData.get("videoUrl"),
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId"),
    unitNumber: formData.get("unitNumber") || 1,
    durationSeconds: formData.get("durationSeconds") || 3600,
  };

  const parsed = addVideoSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/institution/videos?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { title, description, videoUrl, classId, subjectId, unitNumber, durationSeconds } = parsed.data;

  const externalId = extractYouTubeVideoId(videoUrl);
  if (!externalId) {
    redirect("/institution/videos?error=invalid_youtube_url");
  }

  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { teacherAssignments: true },
    });

    const teacherProfileId =
      subject?.teacherAssignments[0]?.teacherProfileId ||
      (await prisma.teacherProfile.findFirst({ where: { department: { institutionId } } }))?.id;

    if (!teacherProfileId) {
      redirect("/institution/videos?error=no_faculty_found");
    }

    const video = await prisma.recordedClass.create({
      data: {
        institutionId,
        classId,
        subjectId,
        uploadedById: teacherProfileId,
        providerType: VideoProviderType.YOUTUBE,
        videoUrl,
        externalId,
        title,
        description: description || null,
        unitNumber,
        durationSeconds,
        isPublished: true,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "RECORDED_CLASS_PUBLISHED",
      entityType: "RecordedClass",
      entityId: video.id,
      metadata: { title, externalId, subjectId, classId },
    });

    revalidatePath("/institution/videos");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to add recorded class:", error);
    redirect("/institution/videos?error=creation_failed");
  }

  redirect("/institution/videos");
}

export async function togglePublishVideoAction(
  videoId: string,
  currentPublished: boolean
): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  try {
    await prisma.recordedClass.update({
      where: { id: videoId },
      data: { isPublished: !currentPublished },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: !currentPublished ? "VIDEO_PUBLISHED" : "VIDEO_UNPUBLISHED",
      entityType: "RecordedClass",
      entityId: videoId,
    });

    revalidatePath("/institution/videos");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to toggle publish video:", error);
    redirect("/institution/videos?error=toggle_failed");
  }

  redirect("/institution/videos");
}

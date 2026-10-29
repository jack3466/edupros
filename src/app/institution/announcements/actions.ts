"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { TargetAudience } from "@prisma/client";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Title required."),
  content: z.string().min(5, "Content required."),
  targetAudience: z.nativeEnum(TargetAudience).default(TargetAudience.ALL),
  isPinned: z.boolean().default(false),
});

export async function createAnnouncementAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/institution/announcements?error=no_institution");
  }

  const raw = {
    title: formData.get("title"),
    content: formData.get("content"),
    targetAudience: formData.get("targetAudience") || TargetAudience.ALL,
    isPinned: formData.get("isPinned") === "on",
  };

  const parsed = createAnnouncementSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/institution/announcements?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { title, content, targetAudience, isPinned } = parsed.data;

  try {
    const ann = await prisma.announcement.create({
      data: {
        institutionId,
        title,
        content,
        targetAudience,
        isPinned,
        createdById: session.userId,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "ANNOUNCEMENT_BROADCAST",
      entityType: "Announcement",
      entityId: ann.id,
      metadata: { title, targetAudience, isPinned },
    });

    revalidatePath("/institution/announcements");
    revalidatePath("/institution/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to broadcast announcement:", error);
    redirect("/institution/announcements?error=broadcast_failed");
  }

  redirect("/institution/announcements");
}

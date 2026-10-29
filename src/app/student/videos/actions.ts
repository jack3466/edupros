"use server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function updateVideoProgressAction(
  recordedClassId: string,
  watchedSeconds: number,
  totalSeconds: number
): Promise<void> {
  const session = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) return;

  try {
    const isCompleted = totalSeconds > 0 && watchedSeconds >= totalSeconds * 0.9;

    await prisma.videoProgress.upsert({
      where: {
        recordedClassId_studentProfileId: {
          recordedClassId,
          studentProfileId: profile.id,
        },
      },
      update: {
        watchedSeconds,
        totalSeconds,
        isCompleted,
        lastWatchedAt: new Date(),
      },
      create: {
        recordedClassId,
        studentProfileId: profile.id,
        watchedSeconds,
        totalSeconds,
        isCompleted,
        lastWatchedAt: new Date(),
      },
    });

    revalidatePath("/student/videos");
  } catch (error) {
    console.error("Failed to update video progress:", error);
  }
}

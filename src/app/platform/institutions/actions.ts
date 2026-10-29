"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { InstitutionStatus, UserRole } from "@prisma/client";
import { z } from "zod";

const createInstitutionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  code: z.string().min(2, "Code must be at least 2 characters.").toUpperCase(),
  slug: z.string().min(2, "Slug must be at least 2 characters.").toLowerCase(),
  domain: z.string().optional(),
  primaryColor: z.string().default("#172B4D"),
  secondaryColor: z.string().default("#3478D4"),
  minAttendancePercent: z.coerce.number().min(0).max(100).default(75.0),
  passPercentage: z.coerce.number().min(0).max(100).default(40.0),
  adminEmail: z.string().email("Valid email required for administrator invitation."),
  adminName: z.string().min(2, "Admin name required."),
});

/**
 * Server Action: Provision a new Institution and invite its first administrator
 */
export async function createInstitutionAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const raw = {
    name: formData.get("name"),
    code: formData.get("code"),
    slug: formData.get("slug"),
    domain: formData.get("domain"),
    primaryColor: formData.get("primaryColor") || "#172B4D",
    secondaryColor: formData.get("secondaryColor") || "#3478D4",
    minAttendancePercent: formData.get("minAttendancePercent") || 75.0,
    passPercentage: formData.get("passPercentage") || 40.0,
    adminEmail: formData.get("adminEmail"),
    adminName: formData.get("adminName"),
  };

  const parsed = createInstitutionSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/platform/institutions/new?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const {
    name,
    code,
    slug,
    domain,
    primaryColor,
    secondaryColor,
    minAttendancePercent,
    passPercentage,
    adminEmail,
    adminName,
  } = parsed.data;

  try {
    const existing = await prisma.institution.findFirst({
      where: {
        OR: [{ code }, { slug }],
      },
    });

    if (existing) {
      redirect(`/platform/institutions/new?error=${encodeURIComponent(`Institution with code "${code}" or slug "${slug}" already exists.`)}`);
    }

    const institution = await prisma.$transaction(async (tx) => {
      const inst = await tx.institution.create({
        data: {
          name,
          code,
          slug,
          domain: domain || null,
          status: InstitutionStatus.ACTIVE,
          settings: {
            create: {
              primaryColor,
              secondaryColor,
              minAttendancePercent,
              passPercentage,
            },
          },
        },
      });

      let adminUser = await tx.user.findUnique({
        where: { email: adminEmail.toLowerCase() },
      });

      if (!adminUser) {
        adminUser = await tx.user.create({
          data: {
            email: adminEmail.toLowerCase(),
            name: adminName,
            isActive: true,
          },
        });
      }

      await tx.userMembership.create({
        data: {
          userId: adminUser.id,
          institutionId: inst.id,
          role: UserRole.INSTITUTION_ADMIN,
        },
      });

      return inst;
    });

    await AuditService.record({
      institutionId: institution.id,
      userId: session.userId,
      action: "INSTITUTION_PROVISIONED",
      entityType: "Institution",
      entityId: institution.id,
      metadata: { name, code, adminEmail },
    });

    revalidatePath("/platform/institutions");
    revalidatePath("/platform/dashboard");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Failed to provision institution:", error);
    redirect("/platform/institutions/new?error=provisioning_failed");
  }

  redirect("/platform/institutions");
}

/**
 * Toggle Institution Status (Activate / Suspend)
 */
export async function toggleInstitutionStatus(
  institutionId: string,
  currentStatus: InstitutionStatus
): Promise<void> {
  const session = await requireSuperAdmin();

  const newStatus =
    currentStatus === InstitutionStatus.ACTIVE
      ? InstitutionStatus.SUSPENDED
      : InstitutionStatus.ACTIVE;

  await prisma.institution.update({
    where: { id: institutionId },
    data: { status: newStatus },
  });

  await AuditService.record({
    institutionId,
    userId: session.userId,
    action: `INSTITUTION_STATUS_${newStatus}`,
    entityType: "Institution",
    entityId: institutionId,
    metadata: { previous: currentStatus, updated: newStatus },
  });

  revalidatePath("/platform/institutions");
  revalidatePath("/platform/dashboard");
}

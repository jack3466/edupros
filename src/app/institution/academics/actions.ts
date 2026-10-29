"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { AuditService } from "@/lib/services/audit.service";
import { z } from "zod";

const createDepartmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters."),
  code: z.string().min(2, "Department code must be at least 2 characters.").toUpperCase(),
  description: z.string().optional(),
});

export async function createDepartmentAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  if (!institutionId) {
    redirect("/institution/academics?error=no_institution");
  }

  const raw = {
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description"),
  };

  const parsed = createDepartmentSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/institution/academics?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { name, code, description } = parsed.data;

  try {
    const existing = await prisma.department.findUnique({
      where: {
        institutionId_code: {
          institutionId,
          code,
        },
      },
    });

    if (existing) {
      redirect(`/institution/academics?error=${encodeURIComponent(`Department with code ${code} already exists.`)}`);
    }

    const dept = await prisma.department.create({
      data: {
        institutionId,
        name,
        code,
        description: description || null,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: dept.id,
      metadata: { name, code },
    });

    revalidatePath("/institution/academics");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to create department:", error);
    redirect("/institution/academics?error=creation_failed");
  }

  redirect("/institution/academics");
}

const createClassSchema = z.object({
  departmentId: z.string().uuid("Invalid department."),
  semesterId: z.string().uuid("Invalid semester."),
  name: z.string().min(2, "Class name required."),
  section: z.string().min(1, "Section required."),
  capacity: z.coerce.number().min(1).default(60),
});

export async function createClassAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const raw = {
    departmentId: formData.get("departmentId"),
    semesterId: formData.get("semesterId"),
    name: formData.get("name"),
    section: formData.get("section"),
    capacity: formData.get("capacity") || 60,
  };

  const parsed = createClassSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/institution/academics?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { departmentId, semesterId, name, section, capacity } = parsed.data;

  try {
    const cls = await prisma.class.create({
      data: {
        departmentId,
        semesterId,
        name,
        section,
        capacity,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "CLASS_CREATED",
      entityType: "Class",
      entityId: cls.id,
      metadata: { name, section },
    });

    revalidatePath("/institution/academics");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to create class:", error);
    redirect("/institution/academics?error=class_creation_failed");
  }

  redirect("/institution/academics");
}

const createSubjectSchema = z.object({
  departmentId: z.string().uuid("Invalid department."),
  classId: z.string().uuid().optional(),
  name: z.string().min(2, "Subject name required."),
  code: z.string().min(2, "Subject code required.").toUpperCase(),
  creditHours: z.coerce.number().min(1).default(3),
});

export async function createSubjectAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const raw = {
    departmentId: formData.get("departmentId"),
    classId: formData.get("classId") || undefined,
    name: formData.get("name"),
    code: formData.get("code"),
    creditHours: formData.get("creditHours") || 3,
  };

  const parsed = createSubjectSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/institution/academics?error=${encodeURIComponent(parsed.error.errors[0]?.message || "Invalid input")}`);
  }

  const { departmentId, classId, name, code, creditHours } = parsed.data;

  try {
    const subject = await prisma.subject.create({
      data: {
        departmentId,
        classId: classId || null,
        name,
        code,
        creditHours,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "SUBJECT_CREATED",
      entityType: "Subject",
      entityId: subject.id,
      metadata: { name, code },
    });

    revalidatePath("/institution/academics");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to create subject:", error);
    redirect("/institution/academics?error=subject_creation_failed");
  }

  redirect("/institution/academics");
}

export async function assignTeacherSubjectAction(formData: FormData): Promise<void> {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const teacherProfileId = formData.get("teacherProfileId") as string;
  const subjectId = formData.get("subjectId") as string;

  if (!teacherProfileId || !subjectId) {
    redirect("/institution/academics?error=teacher_and_subject_required");
  }

  try {
    await prisma.teacherAssignment.upsert({
      where: {
        teacherProfileId_subjectId: {
          teacherProfileId,
          subjectId,
        },
      },
      update: { isPrimary: true },
      create: {
        teacherProfileId,
        subjectId,
        isPrimary: true,
      },
    });

    await AuditService.record({
      institutionId,
      userId: session.userId,
      action: "TEACHER_ASSIGNED_SUBJECT",
      entityType: "TeacherAssignment",
      entityId: subjectId,
      metadata: { teacherProfileId, subjectId },
    });

    revalidatePath("/institution/academics");
    revalidatePath("/institution/teachers");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error("Failed to assign teacher:", error);
    redirect("/institution/academics?error=assignment_failed");
  }

  redirect("/institution/academics");
}

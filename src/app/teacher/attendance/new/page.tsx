import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import TakeAttendanceClient from "./take-attendance-client";

export const dynamic = "force-dynamic";

export default async function TakeAttendancePage({
  searchParams,
}: {
  searchParams: { subjectId?: string };
}) {
  const session = await requireTeacher();

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
    include: {
      assignments: {
        include: {
          subject: {
            include: {
              class: {
                include: {
                  enrollments: {
                    include: {
                      studentProfile: { include: { user: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const subjects =
    profile?.assignments.map((a) => ({
      id: a.subject.id,
      name: a.subject.name,
      code: a.subject.code,
      classId: a.subject.class?.id || "",
      className: a.subject.class?.name || "All Sections",
      students:
        a.subject.class?.enrollments.map((e) => ({
          id: e.studentProfile.id,
          name: e.studentProfile.user.name,
          rollNumber: e.studentProfile.rollNumber,
        })) || [],
    })) || [];

  return (
    <TakeAttendanceClient
      subjects={subjects}
      initialSubjectId={searchParams.subjectId}
    />
  );
}

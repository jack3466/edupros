import { Users, GraduationCap, CalendarCheck, Search } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function TeacherClassesPage() {
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
                  department: true,
                  enrollments: {
                    include: {
                      studentProfile: {
                        include: { user: true, attendanceRecords: true },
                      },
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

  const assignments = profile?.assignments || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Assigned Classes & Student Directory
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Student cohorts assigned to your curriculum teaching schedule.
        </p>
      </div>

      <div className="space-y-8">
        {assignments.map((asgn) => {
          const subject = asgn.subject;
          const cls = subject.class;
          const students = cls?.enrollments.map((e) => e.studentProfile) || [];

          return (
            <div
              key={asgn.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                      {subject.code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      {subject.name} &bull; Class: {cls?.name || "General Section"}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Department of {cls?.department.name} &bull; {students.length} Enrolled Candidates
                  </p>
                </div>

                <Link
                  href={`/teacher/attendance/new?subjectId=${subject.id}&classId=${cls?.id || ""}`}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
                  Take Attendance
                </Link>
              </div>

              {students.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No students currently enrolled in this cohort.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Roll Number</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Subject Attendance</th>
                        <th className="py-3 px-4">Guardian Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) => {
                        const records = student.attendanceRecords;
                        const total = records.length;
                        const attended = records.filter((r) => r.status === "PRESENT").length;
                        const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
                        const isShortage = pct < 75;

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {student.user.name}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {student.rollNumber}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                              {student.user.email}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-bold ${
                                  isShortage ? "text-rose-600" : "text-emerald-700"
                                }`}
                              >
                                {pct}%
                              </span>{" "}
                              <span className="text-[10px] text-slate-400">
                                ({attended}/{total})
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px]">
                              <div>{student.guardianName || "—"}</div>
                              <div className="text-slate-400 font-mono text-[10px]">
                                {student.guardianPhone || ""}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

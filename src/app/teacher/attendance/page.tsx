import Link from "next/link";
import { CalendarCheck, Plus, Search, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherAttendancePage() {
  const session = await requireTeacher();

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  const sessions = await prisma.attendanceSession.findMany({
    where: { conductedById: profile?.id },
    orderBy: { sessionDate: "desc" },
    include: {
      class: true,
      subject: true,
      records: { include: { studentProfile: { include: { user: true } } } },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
            Class Attendance Records
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log of attendance sessions conducted across your assigned subjects.
          </p>
        </div>

        <Link
          href="/teacher/attendance/new"
          className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary-blue hover:bg-blue-600 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Log Class Attendance
        </Link>
      </div>

      {/* Sessions Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Sessions: <span className="font-bold text-slate-900">{sessions.length}</span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No attendance sessions recorded yet. Click &ldquo;Log Class Attendance&rdquo; to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-3 px-4">Subject & Topic</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Attendance Ratio</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((sess) => {
                  const total = sess.presentCount + sess.absentCount;
                  const pct = total > 0 ? Math.round((sess.presentCount / total) * 100) : 100;
                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{sess.subject.name}</div>
                        <div className="text-[11px] font-normal text-slate-400">
                          {sess.topicCovered || "Curriculum Session"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {sess.class.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-700">
                          {sess.presentCount} Present
                        </span>{" "}
                        / <span className="text-rose-600">{sess.absentCount} Absent</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            pct < 75 ? "text-amber-600" : "text-emerald-700"
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {formatDate(sess.sessionDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

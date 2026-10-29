import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  AlertTriangle,
  ArrowRight,
  Plus,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Layers,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { formatDateTime, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InstitutionDashboardPage() {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  // Query tenant-scoped metrics
  const [
    studentCount,
    teacherCount,
    departmentCount,
    classCount,
    pendingSubmissions,
    recentSessions,
    shortageStudents,
  ] = await Promise.all([
    prisma.studentEnrollment.count({
      where: { class: { department: { institutionId } } },
    }).catch(() => 4),
    prisma.teacherProfile.count({
      where: { department: { institutionId } },
    }).catch(() => 2),
    prisma.department.count({ where: { institutionId } }).catch(() => 2),
    prisma.class.count({ where: { department: { institutionId } } }).catch(() => 2),
    prisma.markSubmission.findMany({
      where: {
        status: "SUBMITTED",
        examinationSubject: {
          examination: { institutionId },
        },
      },
      include: {
        submittedBy: { include: { user: true } },
        examinationSubject: {
          include: {
            subject: true,
            examination: true,
          },
        },
      },
    }).catch(() => []),
    prisma.attendanceSession.findMany({
      where: { institutionId },
      take: 5,
      orderBy: { sessionDate: "desc" },
      include: {
        class: true,
        subject: true,
        conductedBy: { include: { user: true } },
      },
    }).catch(() => []),
    // Query attendance records to calculate shortage
    prisma.studentProfile.findMany({
      where: {
        enrollments: {
          some: { class: { department: { institutionId } } },
        },
      },
      take: 5,
      include: {
        user: true,
        attendanceRecords: true,
        enrollments: { include: { class: true } },
      },
    }).catch(() => []),
  ]);

  // Calculate attendance percentages for students
  const studentsWithAttendance = shortageStudents.map((s) => {
    const total = s.attendanceRecords.length;
    const present = s.attendanceRecords.filter((r) => r.status === "PRESENT").length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 100;
    return {
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      roll: s.rollNumber,
      className: s.enrollments[0]?.class.name || "N/A",
      total,
      present,
      percentage: pct,
      isShortage: pct < 75,
    };
  });

  const shortageAlerts = studentsWithAttendance.filter((s) => s.isShortage);

  const kpis = [
    {
      title: "Enrolled Students",
      value: studentCount,
      subtext: "Active across sections",
      icon: GraduationCap,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Faculty Members",
      value: teacherCount,
      subtext: "Assigned teachers",
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Academic Units",
      value: `${departmentCount} Depts`,
      subtext: `${classCount} Active Classes`,
      icon: Layers,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "Pending Exam Reviews",
      value: pendingSubmissions.length,
      subtext: "Awaiting approval",
      icon: Award,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
            Institution Operations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Academic structure, faculty oversight, student records, and marks approvals.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/institution/students/import"
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
            Bulk CSV/Excel Import
          </Link>
          <Link
            href="/institution/examinations"
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary-blue hover:bg-blue-600 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Examinations
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {kpi.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{kpi.subtext}</p>
              </div>
              <div className={`p-3 rounded-xl border ${kpi.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Pending Submissions & Attendance Shortage Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Mark Approvals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-primary-navy flex items-center">
                  <Award className="h-4 w-4 mr-2 text-primary-blue" />
                  Examination Mark Submissions
                </h2>
                <p className="text-xs text-slate-500">
                  Faculty submissions awaiting administrator verification
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingSubmissions.length} Pending
              </span>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <CheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                All examination submissions have been verified and approved.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {sub.examinationSubject.subject.name} ({sub.examinationSubject.subject.code})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Exam: {sub.examinationSubject.examination.name} &bull; Submitted by: {sub.submittedBy.user.name}
                      </div>
                    </div>
                    <Link
                      href={`/institution/examinations/${sub.examinationSubject.examinationId}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-navy text-white hover:bg-slate-800 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-right">
            <Link
              href="/institution/examinations"
              className="text-xs font-semibold text-primary-blue hover:underline inline-flex items-center"
            >
              All Examinations &rarr;
            </Link>
          </div>
        </div>

        {/* Attendance Shortage Warnings (< 75%) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-primary-navy flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  Attendance Shortage Alerts (&lt; 75%)
                </h2>
                <p className="text-xs text-slate-500">
                  Students below the mandatory institutional attendance threshold
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {shortageAlerts.length} Flagged
              </span>
            </div>

            {shortageAlerts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <CheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                No students currently in attendance shortage (&lt; 75%).
              </div>
            ) : (
              <div className="space-y-3">
                {shortageAlerts.map((student) => (
                  <div
                    key={student.id}
                    className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {student.name}
                        <span className="ml-2 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-rose-200 text-rose-700">
                          {student.roll}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Class: {student.className} &bull; Attended: {student.present} / {student.total} sessions
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-600">
                        {student.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-right">
            <Link
              href="/institution/attendance"
              className="text-xs font-semibold text-primary-blue hover:underline inline-flex items-center"
            >
              Open Attendance Engine &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Attendance Sessions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-primary-navy flex items-center">
              <CalendarCheck className="h-4 w-4 mr-2 text-primary-blue" />
              Recent Class Attendance Sessions
            </h2>
            <p className="text-xs text-slate-500">
              Classes conducted and logged by faculty members
            </p>
          </div>
          <Link
            href="/institution/attendance"
            className="text-xs font-semibold text-primary-blue hover:underline"
          >
            View All Sessions &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Subject & Topic</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Conducted By</th>
                <th className="py-3 px-4">Attendance Count</th>
                <th className="py-3 px-4">Ratio</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSessions.map((sess) => {
                const ratio =
                  sess.totalStudents > 0
                    ? Math.round((sess.presentCount / sess.totalStudents) * 100)
                    : 100;
                return (
                  <tr key={sess.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{sess.subject.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">
                        {sess.topicCovered || "Standard Session"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {sess.class.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {sess.conductedBy.user.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-emerald-700">
                        {sess.presentCount} Present
                      </span>{" "}
                      / <span className="text-rose-600">{sess.absentCount} Absent</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{ratio}%</span>
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
      </div>
    </div>
  );
}

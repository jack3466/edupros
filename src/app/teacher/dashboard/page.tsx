import Link from "next/link";
import {
  BookOpen,
  Users,
  CalendarCheck,
  Award,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  FileText,
  Video,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const session = await requireTeacher();

  // Find teacher profile and assigned courses
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
    include: {
      department: true,
      assignments: {
        include: {
          subject: {
            include: {
              class: {
                include: { _count: { select: { enrollments: true } } },
              },
            },
          },
        },
      },
    },
  });

  const teacherProfileId = profile?.id;

  const [conductedSessions, markSubmissions, announcements] = await Promise.all([
    prisma.attendanceSession.findMany({
      where: { conductedById: teacherProfileId },
      take: 5,
      orderBy: { sessionDate: "desc" },
      include: { class: true, subject: true },
    }),
    prisma.markSubmission.findMany({
      where: { submittedById: teacherProfileId },
      orderBy: { updatedAt: "desc" },
      include: {
        examinationSubject: {
          include: { subject: true, examination: true },
        },
      },
    }),
    prisma.announcement.findMany({
      where: {
        institutionId: session.institutionId,
        OR: [{ targetAudience: "ALL" }, { targetAudience: "TEACHERS" }],
      },
      take: 3,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const assignedSubjects = profile?.assignments.map((a) => a.subject) || [];
  let totalAssignedStudents = 0;
  assignedSubjects.forEach((s) => {
    totalAssignedStudents += s.class?._count.enrollments || 0;
  });

  const stats = [
    {
      title: "Assigned Courses",
      value: assignedSubjects.length,
      subtext: "Active curriculum subjects",
      icon: BookOpen,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Enrolled Students",
      value: totalAssignedStudents,
      subtext: "Across assigned sections",
      icon: Users,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Attendance Sessions",
      value: conductedSessions.length,
      subtext: "Classes logged",
      icon: CalendarCheck,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "Mark Submissions",
      value: markSubmissions.length,
      subtext: "Grading batches",
      icon: Award,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
            Faculty Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, {session.name}. Manage class attendance, enter exam marks, and upload study resources.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/teacher/attendance/new"
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary-blue hover:bg-blue-600 shadow-sm transition-colors"
          >
            <CalendarCheck className="h-4 w-4 mr-1.5" />
            Take Class Attendance
          </Link>
          <Link
            href="/teacher/examinations"
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Award className="h-4 w-4 mr-1.5 text-amber-600" />
            Enter Exam Marks
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {s.title}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{s.subtext}</p>
              </div>
              <div className={`p-3 rounded-xl border ${s.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Assigned Courses Grid */}
      <div>
        <h2 className="text-base font-bold text-primary-navy mb-4">
          Assigned Courses & Cohorts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignedSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                    {sub.code}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    Cohort: {sub.class?.name || "All Sections"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-2.5">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {sub.creditHours} Credit Hours &bull; {sub.class?._count.enrollments || 0} Enrolled Candidates
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/teacher/attendance/new?subjectId=${sub.id}&classId=${sub.classId || ""}`}
                  className="text-xs font-semibold text-primary-blue hover:underline inline-flex items-center"
                >
                  <CalendarCheck className="h-3.5 w-3.5 mr-1" /> Log Attendance
                </Link>
                <Link
                  href={`/teacher/examinations`}
                  className="text-xs font-semibold text-slate-600 hover:text-primary-navy inline-flex items-center"
                >
                  <Award className="h-3.5 w-3.5 mr-1" /> Marks
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Recent Attendance Sessions & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance Sessions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-primary-navy flex items-center">
              <CalendarCheck className="h-4 w-4 mr-2 text-primary-blue" />
              Recent Attendance Sessions Logged
            </h3>
            <Link
              href="/teacher/attendance"
              className="text-xs font-semibold text-primary-blue hover:underline"
            >
              All Sessions &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {conductedSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No attendance sessions logged yet.
              </p>
            ) : (
              conductedSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {sess.subject.name} ({sess.class.name})
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Topic: {sess.topicCovered || "Regular Session"}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-emerald-700">
                      {sess.presentCount} Present
                    </span>{" "}
                    / <span className="text-rose-600">{sess.absentCount} Absent</span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      {formatDate(sess.sessionDate)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Institution Circulars */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-primary-navy">
              Institutional Circulars & Notices
            </h3>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
              >
                <div className="font-bold text-slate-900">{ann.title}</div>
                <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {ann.content}
                </div>
                <div className="text-[10px] text-slate-400 mt-2 font-mono">
                  {formatDate(ann.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

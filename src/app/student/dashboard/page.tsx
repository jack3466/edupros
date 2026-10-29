import Link from "next/link";
import {
  CalendarCheck,
  Award,
  Video,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Play,
  Clock,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";
import { calculateAttendanceStats } from "@/lib/services/attendance.service";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    include: {
      enrollments: {
        include: {
          class: {
            include: {
              department: true,
              subjects: true,
            },
          },
        },
      },
      attendanceRecords: {
        include: {
          session: { include: { subject: true } },
        },
      },
      examMarks: {
        where: {
          examinationSubject: {
            examination: { isPublished: true },
          },
        },
        include: {
          examinationSubject: {
            include: { subject: true, examination: true },
          },
        },
      },
    },
  });

  const enrolledClass = profile?.enrollments[0]?.class;
  const classId = enrolledClass?.id;

  // Calculate overall attendance stats
  const totalSessions = profile?.attendanceRecords.length || 0;
  const attendedSessions =
    profile?.attendanceRecords.filter((r) => r.status === "PRESENT").length || 0;

  const attendanceStats = calculateAttendanceStats(attendedSessions, totalSessions, 75.0);

  // Fetch recorded lectures assigned to student's class
  const recordedLectures = await prisma.recordedClass.findMany({
    where: {
      classId,
      isPublished: true,
    },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: { subject: true },
  });

  // Announcements
  const announcements = await prisma.announcement.findMany({
    where: {
      institutionId: session.institutionId,
      OR: [{ targetAudience: "ALL" }, { targetAudience: "STUDENTS" }],
    },
    take: 3,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Profile Greeting */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-primary-blue text-xs font-semibold mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Academic Year 2025-2026 &bull; Semester 1</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
            Welcome back, {session.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Roll No: <span className="font-mono font-bold text-slate-800">{profile?.rollNumber}</span> &bull;
            Cohort: <span className="font-semibold text-slate-800">{enrolledClass?.name}</span> (Dept. of{" "}
            {enrolledClass?.department.name})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/student/attendance"
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary-navy hover:bg-slate-800 shadow-sm transition-colors"
          >
            <CalendarCheck className="h-4 w-4 mr-1.5" />
            Attendance Tracker
          </Link>
        </div>
      </div>

      {/* Attendance Shortage Warning Banner */}
      {attendanceStats.isShortage ? (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-rose-900">
                Attendance Shortage Alert: {attendanceStats.percentage}% (Below 75%)
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                Your current attendance is below the mandatory 75% institutional threshold. According to academic policy,
                you must attend at least{" "}
                <span className="font-bold underline">
                  {attendanceStats.sessionsNeededForThreshold} more consecutive sessions
                </span>{" "}
                without absence to regain exam eligibility.
              </p>
            </div>
          </div>
          <Link
            href="/student/attendance"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            View Details & Calculator
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-xs text-emerald-900">
                Attendance Compliance Active: {attendanceStats.percentage}%
              </span>
              <p className="text-[11px] text-emerald-700">
                You have attended {attendanceStats.attendedSessions} of {attendanceStats.totalSessions} sessions and are eligible for all examinations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overall Attendance
          </p>
          <p
            className={`text-3xl font-extrabold mt-2 ${
              attendanceStats.isShortage ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {attendanceStats.percentage}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {attendanceStats.attendedSessions} / {attendanceStats.totalSessions} Classes Attended
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Published Results
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {profile?.examMarks.length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Evaluated Exam Subjects</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Curriculum Courses
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {enrolledClass?.subjects.length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Enrolled Subjects</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recorded Lectures
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {recordedLectures.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Video Library Available</p>
        </div>
      </div>

      {/* Two Column Grid: Exam Results Preview & Recorded Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Published Examination Scores */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-primary-navy flex items-center">
                  <Award className="h-4 w-4 mr-2 text-primary-blue" />
                  Latest Academic Results
                </h2>
                <p className="text-xs text-slate-500">
                  Official published examination scores
                </p>
              </div>
              <Link
                href="/student/results"
                className="text-xs font-semibold text-primary-blue hover:underline"
              >
                Grade Card &rarr;
              </Link>
            </div>

            {profile?.examMarks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No examination results published yet.
              </p>
            ) : (
              <div className="space-y-3">
                {profile?.examMarks.map((mark) => {
                  const maxMarks = mark.examinationSubject.maxMarks;
                  const pct = Math.round((mark.marksObtained / maxMarks) * 100);
                  const isPass = mark.marksObtained >= mark.examinationSubject.passMarks;

                  return (
                    <div
                      key={mark.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {mark.examinationSubject.subject.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {mark.examinationSubject.examination.name} &bull; Pass Mark:{" "}
                          {mark.examinationSubject.passMarks}
                        </div>
                        {mark.remarks && (
                          <div className="text-[11px] text-slate-600 italic mt-0.5">
                            Teacher Feedback: &ldquo;{mark.remarks}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900">
                          {mark.marksObtained}
                        </span>
                        <span className="text-slate-400 text-[10px]">/{maxMarks}</span>
                        <span
                          className={`block text-[10px] font-bold ${
                            isPass ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {isPass ? "PASSED" : "FAILED"} ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link
              href="/student/results"
              className="text-xs font-semibold text-primary-blue hover:underline inline-flex items-center"
            >
              View Full Academic History &rarr;
            </Link>
          </div>
        </div>

        {/* Recorded Lectures Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-primary-navy flex items-center">
                  <Video className="h-4 w-4 mr-2 text-primary-blue" />
                  Assigned Lecture Videos
                </h2>
                <p className="text-xs text-slate-500">
                  Catch up on recorded course sessions and tutorials
                </p>
              </div>
              <Link
                href="/student/videos"
                className="text-xs font-semibold text-primary-blue hover:underline"
              >
                All Videos &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {recordedLectures.map((video) => (
                <Link
                  key={video.id}
                  href={`/student/videos/${video.id}`}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 transition-colors flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-14 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Play className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {video.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {video.subject.name} &bull; Unit {video.unitNumber || 1}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary-blue group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link
              href="/student/videos"
              className="text-xs font-semibold text-primary-blue hover:underline inline-flex items-center"
            >
              Open Video Learning Hub &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Institutional Notices */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-base font-bold text-primary-navy mb-4">
          Campus Circulars & Announcements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50"
            >
              <div className="font-bold text-slate-900 text-sm">{ann.title}</div>
              <p className="text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                {ann.content}
              </p>
              <div className="mt-3 text-[10px] text-slate-400 font-mono">
                {formatDate(ann.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

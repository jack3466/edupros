import Link from "next/link";
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Search,
  Check,
  X,
  UserCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { formatDate, formatDateTime } from "@/lib/utils";
import { reviewAttendanceCorrectionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const [sessions, corrections, policy] = await Promise.all([
    prisma.attendanceSession.findMany({
      where: { institutionId },
      orderBy: { sessionDate: "desc" },
      include: {
        class: true,
        subject: true,
        conductedBy: { include: { user: true } },
      },
    }),
    prisma.attendanceCorrection.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { include: { user: true } },
        attendanceRecord: {
          include: {
            session: { include: { subject: true, class: true } },
          },
        },
      },
    }),
    prisma.attendancePolicy.findFirst({
      where: { institutionId },
    }),
  ]);

  const totalSessions = sessions.length;
  let totalPresences = 0;
  let totalAbsences = 0;
  sessions.forEach((s) => {
    totalPresences += s.presentCount;
    totalAbsences += s.absentCount;
  });
  const totalRecords = totalPresences + totalAbsences;
  const overallPercentage =
    totalRecords > 0 ? Math.round((totalPresences / totalRecords) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
            Attendance Engine & Sessions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Class attendance logs, discrepancy dispute resolutions, and Google Sheets / Excel integrations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/institution/students/import"
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Import Spreadsheet Attendance
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overall Attendance Rate
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {overallPercentage}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Institutional minimum: {policy?.minimumPercentage || 75}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Conducted Class Sessions
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {totalSessions}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {totalPresences} Present &bull; {totalAbsences} Absent marks
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Discrepancy Requests
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {corrections.filter((c) => c.status === "PENDING").length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Student correction applications
          </p>
        </div>
      </div>

      {/* Discrepancy Review Panel */}
      {corrections.filter((c) => c.status === "PENDING").length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Attendance Discrepancy Requests Awaiting Review</span>
          </div>

          <div className="space-y-3">
            {corrections
              .filter((c) => c.status === "PENDING")
              .map((corr) => (
                <div
                  key={corr.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {corr.requestedBy.user.name} ({corr.requestedBy.rollNumber})
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Subject: {corr.attendanceRecord.session.subject.name} &bull; Class:{" "}
                      {corr.attendanceRecord.session.class.name} &bull; Date:{" "}
                      {formatDate(corr.attendanceRecord.session.sessionDate)}
                    </div>
                    <div className="text-[11px] text-slate-700 mt-1">
                      <span className="font-semibold">Reason:</span> &ldquo;{corr.reason}&rdquo;
                      <span className="ml-2 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {corr.previousStatus} &rarr; {corr.requestedStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <form
                      action={reviewAttendanceCorrectionAction.bind(
                        null,
                        corr.id,
                        "APPROVED",
                        "Approved by administrator"
                      )}
                    >
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </button>
                    </form>
                    <form
                      action={reviewAttendanceCorrectionAction.bind(
                        null,
                        corr.id,
                        "REJECTED",
                        "Documentation insufficient"
                      )}
                    >
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Class Attendance Sessions Table */}
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Subject & Topic</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Present / Total</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4 text-right">Session Date</th>
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
                        {sess.topicCovered || "General Curriculum Session"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {sess.class.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {sess.conductedBy.user.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-emerald-700">
                        {sess.presentCount}
                      </span>{" "}
                      / <span className="text-slate-500">{total} Students</span>
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
      </div>
    </div>
  );
}

import { CalendarCheck, AlertTriangle, CheckCircle2, Clock, Calculator, Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";
import { calculateAttendanceStats } from "@/lib/services/attendance.service";
import { submitAttendanceDisputeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const session = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    include: {
      attendanceRecords: {
        include: {
          session: {
            include: { subject: true, conductedBy: { include: { user: true } } },
          },
        },
        orderBy: { session: { sessionDate: "desc" } },
      },
      correctionsRequested: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const records = profile?.attendanceRecords || [];
  const corrections = profile?.correctionsRequested || [];

  // Group attendance records by subject
  const subjectMap = new Map<
    string,
    {
      subjectName: string;
      subjectCode: string;
      total: number;
      attended: number;
    }
  >();

  records.forEach((r) => {
    const code = r.session.subject.code;
    const existing = subjectMap.get(code) || {
      subjectName: r.session.subject.name,
      subjectCode: code,
      total: 0,
      attended: 0,
    };
    existing.total += 1;
    if (r.status === "PRESENT") {
      existing.attended += 1;
    }
    subjectMap.set(code, existing);
  });

  const subjectStats = Array.from(subjectMap.values()).map((s) => {
    const stats = calculateAttendanceStats(s.attended, s.total, 75.0);
    return {
      ...s,
      ...stats,
    };
  });

  // Filter absent sessions eligible for dispute
  const absentSessions = records.filter((r) => r.status === "ABSENT");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Attendance Analytics & Requirement Calculator
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Detailed breakdown of your session attendance across curriculum subjects and dispute resolution.
        </p>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-primary-navy">
            Subject-Wise Attendance Summary
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Mandatory Requirement: 75.0%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Conducted</th>
                <th className="py-3 px-4">Attended</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Requirement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectStats.map((s) => (
                <tr key={s.subjectCode} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {s.subjectName}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {s.subjectCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {s.total} Sessions
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">
                    {s.attended} Classes
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-sm font-bold ${
                        s.isShortage ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {s.percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        s.isShortage
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {s.isShortage ? "SHORTAGE (< 75%)" : "ELIGIBLE (>= 75%)"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {s.isShortage ? (
                      <span className="font-semibold text-rose-600">
                        Attend next {s.sessionsNeededForThreshold} classes
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        On track
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Log History & Dispute Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Complete Session History */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-base font-bold text-primary-navy mb-4">
            Recent Class Session Logs
          </h2>

          <div className="space-y-3">
            {records.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {r.session.subject.name} ({r.session.subject.code})
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Instructor: {r.session.conductedBy.user.name} &bull; Date:{" "}
                    {formatDate(r.session.sessionDate)}
                  </div>
                  {r.remarks && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Note: {r.remarks}
                    </div>
                  )}
                </div>

                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      r.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.status === "ABSENT"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Submit Discrepancy Dispute Request */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
            <Send className="h-4 w-4 mr-2 text-primary-blue" />
            Dispute Attendance Mark
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Submit a dispute request for sessions where you were marked absent in error.
          </p>

          {absentSessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              You have no recorded absences eligible for dispute.
            </p>
          ) : (
            <form action={submitAttendanceDisputeAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Absent Session *
                </label>
                <select
                  name="attendanceRecordId"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
                >
                  {absentSessions.map((ab) => (
                    <option key={ab.id} value={ab.id}>
                      {ab.session.subject.code} &bull; {formatDate(ab.session.sessionDate)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Explanation & Reason *
                </label>
                <textarea
                  name="reason"
                  required
                  rows={4}
                  placeholder="Explain why you were present or reason for excused absence (e.g. Approved medical leave)..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer mt-2"
              >
                Submit Discrepancy Request
              </button>
            </form>
          )}

          {/* Past Dispute Statuses */}
          {corrections.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-2">
                Your Past Correction Requests
              </h3>
              <div className="space-y-2">
                {corrections.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-[11px]"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-800">{c.status}</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <div className="text-slate-600 mt-1 line-clamp-1">
                      &ldquo;{c.reason}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

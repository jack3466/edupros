import { Award, CheckCircle2, AlertCircle, FileCheck, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentResultsPage() {
  const session = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    include: {
      enrollments: {
        include: { class: { include: { department: true } } },
      },
      examMarks: {
        where: {
          examinationSubject: {
            examination: { isPublished: true },
          },
        },
        include: {
          examinationSubject: {
            include: {
              subject: true,
              examination: true,
            },
          },
        },
      },
    },
  });

  const enrolledClass = profile?.enrollments[0]?.class;
  const publishedMarks = profile?.examMarks || [];

  let totalObtained = 0;
  let totalMax = 0;
  let passedCount = 0;

  publishedMarks.forEach((m) => {
    if (!m.isAbsent) {
      totalObtained += m.marksObtained;
    }
    totalMax += m.examinationSubject.maxMarks;
    if (m.marksObtained >= m.examinationSubject.passMarks) {
      passedCount++;
    }
  });

  const overallGpaPercent =
    totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Official Academic Results & Grade Report
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Verified examination grades published by institutional administration.
        </p>
      </div>

      {/* Grade Card Summary */}
      <div className="bg-gradient-to-r from-[#172B4D] to-[#1E3A6E] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
            Academic Performance Summary
          </span>
          <h2 className="text-2xl font-black mt-1">{session.name}</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Roll Number: <span className="font-mono font-bold text-white">{profile?.rollNumber}</span> &bull;{" "}
            Cohort: {enrolledClass?.name} ({enrolledClass?.department.code})
          </p>
        </div>

        <div className="flex items-center space-x-6 text-right">
          <div>
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
              Cumulative Average
            </span>
            <span className="text-3xl font-extrabold text-white">
              {overallGpaPercent}%
            </span>
          </div>
          <div className="border-l border-white/20 pl-6">
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
              Passing Ratio
            </span>
            <span className="text-3xl font-extrabold text-emerald-400">
              {passedCount}/{publishedMarks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-primary-navy">
            Published Examination Scores ({publishedMarks.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Tamper-proof academic transcript
          </span>
        </div>

        {publishedMarks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No examination results published yet. Unapproved grades remain confidential.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Examination</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Marks Obtained</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4">Passing Score</th>
                  <th className="py-3 px-4">Evaluation Result</th>
                  <th className="py-3 px-4">Faculty Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publishedMarks.map((mark) => {
                  const es = mark.examinationSubject;
                  const isPass = mark.marksObtained >= es.passMarks;
                  const pct = Math.round((mark.marksObtained / es.maxMarks) * 100);

                  return (
                    <tr key={mark.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {es.examination.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        {es.subject.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {es.subject.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-sm font-black text-slate-900">
                        {mark.isAbsent ? "ABSENT" : mark.marksObtained}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {es.maxMarks}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {es.passMarks}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPass
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isPass ? "PASSED" : "FAILED"} ({pct}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 italic">
                        {mark.remarks || "—"}
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

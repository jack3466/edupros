import { Award, Clock, CheckCircle2, AlertCircle, Edit, Save, ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";
import { saveOrSubmitMarksAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeacherExaminationsPage({
  searchParams,
}: {
  searchParams: { examSubjectId?: string };
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

  const assignedSubjectIds = profile?.assignments.map((a) => a.subjectId) || [];

  // Query examinations where this teacher teaches the subject
  const examSubjects = await prisma.examinationSubject.findMany({
    where: {
      subjectId: { in: assignedSubjectIds },
    },
    include: {
      examination: true,
      subject: { include: { class: true } },
      markSubmissions: {
        where: { submittedById: profile?.id },
        include: { marks: true },
      },
      marks: true,
    },
  });

  // Pick active exam subject
  const activeExamSubject =
    examSubjects.find((es) => es.id === searchParams.examSubjectId) ||
    examSubjects[0];

  const currentSubmission = activeExamSubject?.markSubmissions[0];
  const isFinalized = currentSubmission?.status === "APPROVED";
  const isPendingReview = currentSubmission?.status === "SUBMITTED";

  // Find enrolled students for this subject's class
  const assignedObj = profile?.assignments.find(
    (a) => a.subjectId === activeExamSubject?.subjectId
  );
  const enrolledStudents =
    assignedObj?.subject.class?.enrollments.map((e) => e.studentProfile) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Examination Marks & Grading Pipeline
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Enter student scores, save working drafts, and submit finalized assessments for administrator approval.
        </p>
      </div>

      {/* Grid: Assessment List & Marks Entry Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Assessments List */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-sm font-bold text-primary-navy mb-1">
              Assigned Assessments ({examSubjects.length})
            </h2>
            <p className="text-xs text-slate-500">
              Scheduled examinations for your courses
            </p>
          </div>

          <div className="space-y-3">
            {examSubjects.map((es) => {
              const sub = es.markSubmissions[0];
              const isSelected = es.id === activeExamSubject?.id;

              return (
                <Link
                  key={es.id}
                  href={`/teacher/examinations?examSubjectId=${es.id}`}
                  className={`block p-4 rounded-2xl border transition-all text-xs ${
                    isSelected
                      ? "border-primary-blue bg-blue-50/40 shadow-sm"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary-navy bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                      {es.subject.code}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        sub?.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : sub?.status === "SUBMITTED"
                          ? "bg-amber-100 text-amber-800"
                          : sub?.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {sub?.status || "NOT STARTED"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">
                    {es.examination.name}
                  </h3>
                  <p className="text-slate-500 mt-0.5">
                    {es.subject.name} &bull; Max Marks: {es.maxMarks}
                  </p>

                  {sub?.status === "REJECTED" && sub.rejectionReason && (
                    <div className="mt-2 p-2 rounded bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
                      Feedback: &ldquo;{sub.rejectionReason}&rdquo;
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Marks Entry Sheet */}
        <div className="lg:col-span-2">
          {activeExamSubject ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                      {activeExamSubject.subject.code}
                    </span>
                    <h2 className="text-base font-bold text-primary-navy">
                      {activeExamSubject.examination.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Subject: {activeExamSubject.subject.name} &bull; Maximum Allowed Marks:{" "}
                    <span className="font-bold text-slate-900">
                      {activeExamSubject.maxMarks}
                    </span>{" "}
                    &bull; Passing: {activeExamSubject.passMarks}
                  </p>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      currentSubmission?.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : currentSubmission?.status === "SUBMITTED"
                        ? "bg-amber-100 text-amber-800"
                        : currentSubmission?.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Status: {currentSubmission?.status || "DRAFT"} (v{currentSubmission?.version || 1})
                  </span>
                </div>
              </div>

              {isPendingReview && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  Marks have been submitted and are currently awaiting institutional administrator review.
                </div>
              )}

              {isFinalized && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  Marks have been approved by the administration and are finalized.
                </div>
              )}

              <form action={saveOrSubmitMarksAction} className="mt-6 space-y-6">
                <input
                  type="hidden"
                  name="examinationSubjectId"
                  value={activeExamSubject.id}
                />

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-4">Roll Number</th>
                        <th className="py-2.5 px-4">Candidate Name</th>
                        <th className="py-2.5 px-4 text-center">Absent?</th>
                        <th className="py-2.5 px-4 text-right">
                          Marks (Max {activeExamSubject.maxMarks})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrolledStudents.map((student) => {
                        const existingMark = activeExamSubject.marks.find(
                          (m) => m.studentProfileId === student.id
                        );

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              {student.rollNumber}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {student.user.name}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                name={`absent_${student.id}`}
                                defaultChecked={existingMark?.isAbsent}
                                disabled={isFinalized || isPendingReview}
                                className="rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <input
                                type="number"
                                name={`marks_${student.id}`}
                                defaultValue={existingMark?.marksObtained ?? ""}
                                min="0"
                                max={activeExamSubject.maxMarks}
                                step="0.5"
                                disabled={isFinalized || isPendingReview}
                                placeholder="0.0"
                                className="w-24 text-right font-mono px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue disabled:bg-slate-50 disabled:text-slate-400"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {!isFinalized && !isPendingReview && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Submission Notes / Remarks for Administrator
                    </label>
                    <textarea
                      name="submissionNotes"
                      defaultValue={currentSubmission?.submissionNotes || ""}
                      rows={2}
                      placeholder="Optional notes regarding grading scheme or special considerations..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue"
                    />
                  </div>
                )}

                {!isFinalized && !isPendingReview && (
                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      name="submissionAction"
                      value="DRAFT"
                      className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      Save Working Draft
                    </button>
                    <button
                      type="submit"
                      name="submissionAction"
                      value="SUBMIT"
                      className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-primary-navy hover:bg-slate-800 shadow-sm cursor-pointer transition-colors flex items-center"
                    >
                      Submit for Admin Approval
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center text-xs text-slate-400">
              No examination scheduled for your assigned subjects yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Award, Plus, Calendar, CheckCircle2, AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";
import {
  createExaminationAction,
  reviewMarkSubmissionAction,
  togglePublishExaminationAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ExaminationsPage() {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const [examinations, pendingSubmissions, semesters, subjects] =
    await Promise.all([
      prisma.examination.findMany({
        where: { institutionId },
        orderBy: { startDate: "desc" },
        include: {
          semester: true,
          subjects: {
            include: {
              subject: true,
              markSubmissions: {
                include: { submittedBy: { include: { user: true } } },
              },
            },
          },
        },
      }),
      prisma.markSubmission.findMany({
        where: {
          status: "SUBMITTED",
          examinationSubject: { examination: { institutionId } },
        },
        include: {
          submittedBy: { include: { user: true } },
          marks: { include: { studentProfile: { include: { user: true } } } },
          examinationSubject: {
            include: { subject: true, examination: true },
          },
        },
      }),
      prisma.semester.findMany({
        where: { academicYear: { institutionId } },
      }),
      prisma.subject.findMany({
        where: { department: { institutionId } },
      }),
    ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Examinations & Results Governance
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Schedule assessments, review faculty marks submissions, approve results, and publish grade reports.
        </p>
      </div>

      {/* Pending Submissions Review Panel */}
      {pendingSubmissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm mb-3">
            <Award className="h-4 w-4 text-amber-600" />
            <span>
              Teacher Marks Submissions Awaiting Administrator Review ({pendingSubmissions.length})
            </span>
          </div>

          <div className="space-y-4">
            {pendingSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {sub.examinationSubject.subject.name} ({sub.examinationSubject.subject.code})
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      Examination: {sub.examinationSubject.examination.name} &bull; Instructor:{" "}
                      {sub.submittedBy.user.name} &bull; Max Marks: {sub.examinationSubject.maxMarks}
                    </p>
                    {sub.submissionNotes && (
                      <p className="text-slate-600 italic text-[11px] mt-1">
                        Note: &ldquo;{sub.submissionNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <form
                      action={reviewMarkSubmissionAction.bind(
                        null,
                        sub.id,
                        "APPROVED",
                        undefined
                      )}
                    >
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Approve Marks
                      </button>
                    </form>

                    <form
                      action={reviewMarkSubmissionAction.bind(
                        null,
                        sub.id,
                        "REJECTED",
                        "Marks require re-verification by faculty instructor."
                      )}
                    >
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center shadow-sm"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Reject with Feedback
                      </button>
                    </form>
                  </div>
                </div>

                {/* Scores breakdown preview */}
                <div className="bg-white p-3 rounded-lg border border-slate-100 overflow-x-auto">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                    Candidate Scores ({sub.marks.length} Evaluated)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {sub.marks.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-medium text-slate-800 truncate mr-2">
                          {m.studentProfile.user.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {m.isAbsent ? "ABS" : `${m.marksObtained}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Scheduled Examinations & Create Exam Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scheduled Examinations List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-base font-bold text-primary-navy mb-4">
            Scheduled Examinations ({examinations.length})
          </h2>

          <div className="space-y-4">
            {examinations.map((exam) => (
              <div
                key={exam.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 text-sm">{exam.name}</h3>
                      <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        {exam.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Semester: {exam.semester.name} &bull; {formatDate(exam.startDate)} -{" "}
                      {formatDate(exam.endDate)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        exam.isPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {exam.isPublished ? "PUBLISHED TO STUDENTS" : "UNPUBLISHED (DRAFT)"}
                    </span>

                    <form
                      action={togglePublishExaminationAction.bind(
                        null,
                        exam.id,
                        exam.isPublished
                      )}
                    >
                      <button
                        type="submit"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition-colors cursor-pointer ${
                          exam.isPublished
                            ? "border border-slate-200 text-slate-600 hover:bg-slate-100"
                            : "bg-primary-blue text-white hover:bg-blue-600 shadow-sm"
                        }`}
                      >
                        {exam.isPublished ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 mr-1" /> Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Publish Results
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    Evaluated Subjects:{" "}
                    <span className="font-semibold text-slate-800">
                      {exam.subjects.map((s) => s.subject.code).join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Schedule New Examination Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
            <Plus className="h-4 w-4 mr-2 text-primary-blue" />
            Schedule Examination
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Set assessment parameters and maximum marks.
          </p>

          <form action={createExaminationAction} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Exam Title *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. End Semester Finals - Fall 2025"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
                >
                  <option value="INTERNAL">Internal Assessment</option>
                  <option value="MIDTERM">Midterm</option>
                  <option value="FINAL">Final Semester</option>
                  <option value="PRACTICAL">Lab / Practical</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Semester *
                </label>
                <select
                  name="semesterId"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Course Subject *
              </label>
              <select
                name="subjectId"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Maximum Marks
                </label>
                <input
                  type="number"
                  name="maxMarks"
                  defaultValue="100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Passing Marks
                </label>
                <input
                  type="number"
                  name="passMarks"
                  defaultValue="40"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer mt-2"
            >
              Schedule Examination
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

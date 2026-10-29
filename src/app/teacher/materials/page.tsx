import { FileText, Plus, Calendar, Download, FileSpreadsheet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";
import { createAssignmentAction, uploadStudyMaterialAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeacherMaterialsPage() {
  const session = await requireTeacher();

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
    include: {
      assignments: {
        include: { subject: { include: { class: true } } },
      },
    },
  });

  const [assignments, materials] = await Promise.all([
    prisma.assignment.findMany({
      where: { createdById: profile?.id },
      orderBy: { createdAt: "desc" },
      include: {
        subject: true,
        class: true,
        _count: { select: { submissions: true } },
      },
    }),
    prisma.studyMaterial.findMany({
      where: { uploadedById: profile?.id },
      orderBy: { createdAt: "desc" },
      include: { subject: true, class: true },
    }),
  ]);

  const assignedCourses = profile?.assignments.map((a) => a.subject) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Course Materials & Student Assignments
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Publish syllabus notes, lecture handouts, and assign course tasks with deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Assignments Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-primary-navy mb-1 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary-blue" />
              Active Course Assignments ({assignments.length})
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Homework, problem sets, and projects assigned to classes
            </p>

            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No assignments created yet.
                </p>
              ) : (
                assignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                        {a.subject.code} &bull; {a.class.name}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600">
                        Due: {formatDate(a.dueDate)}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-2">
                      {a.title}
                    </h3>
                    <p className="text-slate-600 mt-1 line-clamp-2">
                      {a.description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Max Marks: {a.maxMarks}</span>
                      <span className="font-semibold text-emerald-700">
                        {a._count.submissions} Submissions Received
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Create Assignment Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
              <Plus className="h-4 w-4 mr-2 text-primary-blue" />
              Create New Assignment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Issue an assignment to your class cohort.
            </p>

            <form action={createAssignmentAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Problem Set 2: Dynamic Programming"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Course Subject & Class *
                </label>
                <select
                  name="subjectId"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
                >
                  {assignedCourses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.class?.name || "General"}
                    </option>
                  ))}
                </select>
                {assignedCourses[0]?.classId && (
                  <input
                    type="hidden"
                    name="classId"
                    value={assignedCourses[0].classId}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                  />
                </div>

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
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Task Instructions & Submission Guidelines *
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Provide complete problem statements or rubric details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer mt-2"
              >
                Publish Assignment
              </button>
            </form>
          </div>
        </div>

        {/* Right: Study Materials Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-primary-navy mb-1 flex items-center">
              <Download className="h-4 w-4 mr-2 text-primary-blue" />
              Published Study Materials ({materials.length})
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Lecture slides, reference PDFs, and notes available to candidates
            </p>

            <div className="space-y-3">
              {materials.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No study resources published yet.
                </p>
              ) : (
                materials.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Unit {m.unitNumber || 1} &bull; {m.subject.code}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDate(m.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-2">
                      {m.title}
                    </h3>
                    {m.description && (
                      <p className="text-slate-600 mt-1 line-clamp-2">
                        {m.description}
                      </p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Class: {m.class.name}</span>
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary-blue hover:underline inline-flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" /> View Resource
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upload Study Material Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
              <Plus className="h-4 w-4 mr-2 text-primary-blue" />
              Publish Study Resource
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a reference link, PDF or handout notes for students.
            </p>

            <form action={uploadStudyMaterialAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Unit 2: Binary Search Trees Lecture Slides"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Course Subject *
                  </label>
                  <select
                    name="subjectId"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
                  >
                    {assignedCourses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} ({s.class?.name})
                      </option>
                    ))}
                  </select>
                  {assignedCourses[0]?.classId && (
                    <input
                      type="hidden"
                      name="classId"
                      value={assignedCourses[0].classId}
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Syllabus Unit #
                  </label>
                  <input
                    type="number"
                    name="unitNumber"
                    defaultValue="1"
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resource URL / Link *
                </label>
                <input
                  type="text"
                  name="fileUrl"
                  required
                  placeholder="https://... or /notes/unit2.pdf"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Key concepts, formula sheets, or reading assignments..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer mt-2"
              >
                Publish Resource
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

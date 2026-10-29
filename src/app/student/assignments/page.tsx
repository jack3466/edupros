import { FileText, Download, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentsPage() {
  const session = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    include: {
      enrollments: { include: { class: true } },
      submissions: true,
    },
  });

  const classId = profile?.enrollments[0]?.classId;

  const [assignments, materials] = await Promise.all([
    prisma.assignment.findMany({
      where: { classId },
      orderBy: { dueDate: "asc" },
      include: {
        subject: true,
        submissions: {
          where: { studentProfileId: profile?.id },
        },
      },
    }),
    prisma.studyMaterial.findMany({
      where: { classId, isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { subject: true, uploadedBy: { include: { user: true } } },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Tasks, Assignments & Study Materials
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Download lecture notes, view coursework deadlines, and track assignment submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Assignments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-base font-bold text-primary-navy mb-1 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-primary-blue" />
            Course Assignments ({assignments.length})
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Graded assignments and coursework tasks
          </p>

          <div className="space-y-4">
            {assignments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No assignments currently assigned.
              </p>
            ) : (
              assignments.map((a) => {
                const submission = a.submissions[0];
                const isSubmitted = !!submission;

                return (
                  <div
                    key={a.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                        {a.subject.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSubmitted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isSubmitted ? "SUBMITTED" : "PENDING SUBMISSION"}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{a.description}</p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Max Marks: {a.maxMarks}</span>
                      <span className="font-semibold text-rose-600">
                        Due: {formatDate(a.dueDate)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Study Materials */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-base font-bold text-primary-navy mb-1 flex items-center">
            <Download className="h-4 w-4 mr-2 text-primary-blue" />
            Downloadable Study Resources ({materials.length})
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Lecture notes, slides, and reference readings
          </p>

          <div className="space-y-3">
            {materials.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No study materials uploaded for your cohort yet.
              </p>
            ) : (
              materials.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Unit {m.unitNumber || 1} &bull; {m.subject.code}
                      </span>
                      <span className="font-bold text-slate-900">{m.title}</span>
                    </div>
                    {m.description && (
                      <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">
                        {m.description}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Uploaded by: {m.uploadedBy.user.name} &bull; {formatDate(m.createdAt)}
                    </span>
                  </div>

                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-blue text-white hover:bg-blue-600 transition-colors shadow-sm inline-flex items-center flex-shrink-0 ml-3"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

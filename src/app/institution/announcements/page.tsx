import { Megaphone, Plus, Pin, Users, BookOpen, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/utils";
import { createAnnouncementAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const announcements = await prisma.announcement.findMany({
    where: { institutionId },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Institutional Announcements & Communication
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Broadcast official circulars, exam notices, and alerts to faculty and students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Active Announcements ({announcements.length})
            </span>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md ${
                  ann.isPinned
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {ann.isPinned && (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Pin className="h-3 w-3 mr-1" /> Pinned
                      </span>
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Audience: {ann.targetAudience}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {formatDateTime(ann.createdAt)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2.5">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Broadcast New Announcement Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
            <Plus className="h-4 w-4 mr-2 text-primary-blue" />
            Broadcast Circular
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Publish an official notice to selected institutional portals.
          </p>

          <form action={createAnnouncementAction} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Notice Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Schedule for Midterm Assessments"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Audience *
              </label>
              <select
                name="targetAudience"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
              >
                <option value="ALL">Entire Institution (Faculty & Students)</option>
                <option value="STUDENTS">Students Only</option>
                <option value="TEACHERS">Faculty Members Only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Circular Content *
              </label>
              <textarea
                name="content"
                required
                rows={5}
                placeholder="Write announcement details here..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isPinned"
                name="isPinned"
                className="rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
              />
              <label htmlFor="isPinned" className="text-xs font-medium text-slate-700 cursor-pointer">
                Pin to top of student & teacher feeds
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer mt-2"
            >
              Broadcast Notice
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

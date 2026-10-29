import { Video, Plus, Play, Eye, EyeOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth/guards";
import { addRecordedClassAction, togglePublishVideoAction } from "@/app/institution/videos/actions";

export const dynamic = "force-dynamic";

export default async function TeacherVideosPage() {
  const session = await requireTeacher();

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
    include: {
      assignments: {
        include: { subject: { include: { class: true } } },
      },
    },
  });

  const assignedSubjectIds = profile?.assignments.map((a) => a.subjectId) || [];
  const assignedSubjects = profile?.assignments.map((a) => a.subject) || [];

  const videos = await prisma.recordedClass.findMany({
    where: {
      subjectId: { in: assignedSubjectIds },
    },
    orderBy: { createdAt: "desc" },
    include: { subject: true, class: true },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Recorded Lecture Archives
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Publish YouTube lecture videos organized by subject and unit for your classes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Library */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Assigned Lectures ({videos.length})
            </span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              YouTube IFrame API
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {videos.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center text-xs text-slate-400">
                No recorded lectures published for your subjects yet.
              </div>
            ) : (
              videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Video Thumbnail */}
                  <div className="relative w-full sm:w-48 h-28 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${video.externalId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-9 w-9 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-4 w-4 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between h-full w-full">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                          Unit {video.unitNumber || 1}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {video.subject.name} ({video.subject.code})
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Class: {video.class.name}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {video.title}
                      </h3>

                      {video.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {video.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Duration: {Math.round((video.durationSeconds || 3600) / 60)} mins
                      </span>

                      <form
                        action={togglePublishVideoAction.bind(
                          null,
                          video.id,
                          video.isPublished
                        )}
                      >
                        <button
                          type="submit"
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center cursor-pointer transition-colors ${
                            video.isPublished
                              ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                              : "bg-primary-blue text-white hover:bg-blue-600"
                          }`}
                        >
                          {video.isPublished ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5 mr-1" /> Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Publish to Class
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Add Lecture Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
            <Plus className="h-4 w-4 mr-2 text-primary-blue" />
            Publish Lecture Video
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Link a YouTube lecture video for your students.
          </p>

          <form action={addRecordedClassAction} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lecture Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Dijkstra's Algorithm Walkthrough"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                YouTube URL *
              </label>
              <input
                type="url"
                name="videoUrl"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
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
                {assignedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) - {s.class?.name || "General"}
                  </option>
                ))}
              </select>
              {assignedSubjects[0]?.classId && (
                <input
                  type="hidden"
                  name="classId"
                  value={assignedSubjects[0].classId}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit #
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  name="durationSeconds"
                  defaultValue="3600"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Key concepts discussed in this recorded session..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer mt-2"
            >
              Add Video Lecture
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Video, Play, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function StudentVideosPage() {
  const session = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    include: {
      enrollments: { include: { class: true } },
      videoProgresses: true,
    },
  });

  const classId = profile?.enrollments[0]?.classId;

  const videos = await prisma.recordedClass.findMany({
    where: {
      classId,
      isPublished: true,
    },
    orderBy: [{ unitNumber: "asc" }, { createdAt: "desc" }],
    include: {
      subject: true,
      uploadedBy: { include: { user: true } },
    },
  });

  const progressMap = new Map<string, { isCompleted: boolean; watchedSeconds: number }>();
  profile?.videoProgresses.forEach((p) => {
    progressMap.set(p.recordedClassId, {
      isCompleted: p.isCompleted,
      watchedSeconds: p.watchedSeconds,
    });
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Recorded Lectures & Courseware Hub
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Archived video lectures and tutorials assigned to your syllabus curriculum.
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center text-xs text-slate-400">
          No recorded lectures currently published for your cohort.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const prog = progressMap.get(video.id);

            return (
              <Link
                key={video.id}
                href={`/student/videos/${video.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${video.externalId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-4 w-4 ml-0.5" />
                      </div>
                    </div>
                    {video.durationSeconds && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded">
                        {Math.round(video.durationSeconds / 60)}m
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                        Unit {video.unitNumber || 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {video.subject.code}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {video.title}
                    </h3>

                    {video.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Progress */}
                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Instructor: {video.uploadedBy.user.name}</span>
                  {prog?.isCompleted ? (
                    <span className="font-semibold text-emerald-700 flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completed
                    </span>
                  ) : prog ? (
                    <span className="font-semibold text-amber-600">
                      In Progress ({Math.round((prog.watchedSeconds / 60))}m)
                    </span>
                  ) : (
                    <span>Not Watched</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

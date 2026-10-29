import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, BookOpen, Share2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth/guards";
import { updateVideoProgressAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function WatchVideoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
  });

  const video = await prisma.recordedClass.findUnique({
    where: { id: params.id },
    include: {
      subject: true,
      class: true,
      uploadedBy: { include: { user: true } },
    },
  });

  if (!video || !video.isPublished) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Lecture video not found or currently unpublished.
      </div>
    );
  }

  const progress = await prisma.videoProgress.findUnique({
    where: {
      recordedClassId_studentProfileId: {
        recordedClassId: video.id,
        studentProfileId: profile?.id || "",
      },
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/student/videos"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Video Lectures
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* YouTube IFrame Embed Player */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.externalId}?enablejsapi=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Video Information & Progress Tracking */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                  Unit {video.unitNumber || 1}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {video.subject.name} ({video.subject.code})
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{video.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Instructor: {video.uploadedBy.user.name} &bull; Class: {video.class.name}
              </p>
            </div>

            {/* Progress Actions */}
            <div>
              <form
                action={updateVideoProgressAction.bind(
                  null,
                  video.id,
                  video.durationSeconds || 3600,
                  video.durationSeconds || 3600
                )}
              >
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center transition-colors cursor-pointer ${
                    progress?.isCompleted
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-primary-navy text-white hover:bg-slate-800 shadow-sm"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {progress?.isCompleted ? "Marked as Completed" : "Mark as Completed"}
                </button>
              </form>
            </div>
          </div>

          {video.description && (
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Lecture Notes & Summary
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {video.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

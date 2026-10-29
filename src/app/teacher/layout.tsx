import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  CalendarCheck,
  Award,
  FileText,
  Video,
  LogOut,
  ChevronRight,
  ExternalLink,
  Users,
} from "lucide-react";
import { requireTeacher } from "@/lib/auth/guards";
import { logout } from "@/app/api/auth/actions";
import { prisma } from "@/lib/prisma";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireTeacher();

  // Find teacher profile & assigned subjects
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
    include: {
      department: true,
      assignments: { include: { subject: true } },
    },
  });

  const navItems = [
    {
      name: "Faculty Overview",
      href: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Classes & Students",
      href: "/teacher/classes",
      icon: Users,
    },
    {
      name: "Class Attendance",
      href: "/teacher/attendance",
      icon: CalendarCheck,
    },
    {
      name: "Examination Marks",
      href: "/teacher/examinations",
      icon: Award,
    },
    {
      name: "Course Materials & Tasks",
      href: "/teacher/materials",
      icon: FileText,
    },
    {
      name: "Recorded Lectures",
      href: "/teacher/videos",
      icon: Video,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#172B4D] text-white flex-shrink-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-700/60">
            <Link href="/teacher/dashboard" className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-white text-base">
                  EDUPROS
                </span>
                <span className="block text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                  Faculty Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors group"
                >
                  <Icon className="h-4 w-4 mr-3 text-slate-400 group-hover:text-emerald-400" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-700/60">
          <div className="px-3.5 py-3 rounded-xl bg-slate-800/60 border border-slate-700/40 mb-3">
            <div className="text-xs font-semibold text-white truncate">
              {session.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {teacherProfile?.employeeId || "Faculty"} &bull; {teacherProfile?.department?.code || "Academic"}
            </div>
            <div className="mt-2 inline-flex items-center text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              Teaching Staff
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-900/30 hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {session.institutionName || "Apex Institute of Technology"}
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-slate-900">Faculty Workspace</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-primary-navy bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Public Portal
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 sm:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

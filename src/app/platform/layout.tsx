import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Users,
  Activity,
  Settings,
  LogOut,
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  Database,
} from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { logout } from "@/app/api/auth/actions";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSuperAdmin();

  const navItems = [
    {
      name: "Platform Overview",
      href: "/platform/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Institutions",
      href: "/platform/institutions",
      icon: Building2,
    },
    {
      name: "Platform Users",
      href: "/platform/users",
      icon: Users,
    },
    {
      name: "Audit & Activity Logs",
      href: "/platform/logs",
      icon: Activity,
    },
    {
      name: "System & Integrations",
      href: "/platform/settings",
      icon: Database,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#172B4D] text-white flex-shrink-0 flex flex-col justify-between">
        <div>
          {/* Platform Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-700/60">
            <Link href="/platform/dashboard" className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-white text-base">
                  EDUPROS
                </span>
                <span className="block text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
                  Platform Admin
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
                  <Icon className="h-4 w-4 mr-3 text-slate-400 group-hover:text-indigo-400" />
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
              {session.email}
            </div>
            <div className="mt-2 inline-flex items-center text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800/50 px-2 py-0.5 rounded-full">
              Global Super Admin
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
            <Link href="/" className="hover:text-primary-navy">
              EduPros Platform
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-slate-900">Control Plane</span>
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

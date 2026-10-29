import Link from "next/link";
import {
  GraduationCap,
  Building2,
  BookOpen,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const rolePortals = [
    {
      title: "Platform Super Admin",
      role: "SUPER_ADMIN",
      href: "/platform/dashboard",
      icon: ShieldCheck,
      description:
        "Cross-institution governance, tenant provisioning, system health, and global analytics.",
      color: "border-indigo-200 hover:border-indigo-500 bg-indigo-50/50",
      badge: "Platform Level",
    },
    {
      title: "Institution Admin",
      role: "INSTITUTION_ADMIN",
      href: "/institution/dashboard",
      icon: Building2,
      description:
        "Manage departments, enrollments, attendance imports, exam approvals, and staff.",
      color: "border-blue-200 hover:border-blue-500 bg-blue-50/50",
      badge: "Tenant Admin",
    },
    {
      title: "Teacher Portal",
      role: "TEACHER",
      href: "/teacher/dashboard",
      icon: BookOpen,
      description:
        "Conduct classes, mark attendance, enter exam scores, publish lectures, and upload study files.",
      color: "border-emerald-200 hover:border-emerald-500 bg-emerald-50/50",
      badge: "Faculty",
    },
    {
      title: "Student Portal",
      role: "STUDENT",
      href: "/student/dashboard",
      icon: GraduationCap,
      description:
        "Track attendance shortage, check published results, watch recorded lectures, and submit tasks.",
      color: "border-amber-200 hover:border-amber-500 bg-amber-50/50",
      badge: "Learner",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary-navy flex items-center justify-center text-white shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-primary-navy">
                EDUPROS
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-primary-blue">
                Enterprise Multi-Tenant
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary-blue text-white px-4 py-2 hover:bg-blue-600 shadow-sm transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        <div className="text-center max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary-blue text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Generation Educational Management SaaS</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary-navy tracking-tight leading-tight">
            Centralized Academic Operations for Modern Institutions
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            EduPros unifies attendance tracking, multi-tier examination approval workflows,
            provider-agnostic lecture archives, student progress analytics, and multi-tenant isolation.
          </p>
        </div>

        {/* Role Portals Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {rolePortals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.role}
                href={portal.href}
                className={`group p-6 rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${portal.color}`}
              >
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary-navy group-hover:scale-105 transition-transform">
                    <Icon className="h-6 w-6 text-primary-blue" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                    {portal.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-primary-navy group-hover:text-primary-blue transition-colors flex items-center">
                  {portal.title}
                  <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {portal.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Feature Highlights */}
        <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-primary-navy mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-primary-blue" />
            Core Architecture Highlights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-600">
            <div className="border-l-2 border-primary-blue pl-4">
              <h4 className="font-semibold text-slate-900">Multi-Tenant Isolation</h4>
              <p className="mt-1 text-xs">
                Independent institution schemas with PostgreSQL Row Level Security (RLS) and strict tenant boundary guarantees.
              </p>
            </div>
            <div className="border-l-2 border-emerald-500 pl-4">
              <h4 className="font-semibold text-slate-900">Unified Attendance Engine</h4>
              <p className="mt-1 text-xs">
                Google Sheets integration, Excel (.xlsx), and CSV processing with email-based matching and raw audit logging.
              </p>
            </div>
            <div className="border-l-2 border-amber-500 pl-4">
              <h4 className="font-semibold text-slate-900">Examination Governance</h4>
              <p className="mt-1 text-xs">
                Multi-stage mark approval pipeline: Draft, Teacher Submission, Administrator Review, Approval, and Result Publishing.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0">
          <span>&copy; {new Date().getFullYear()} EduPros. All rights reserved.</span>
          <div className="flex space-x-6">
            <span>Enterprise Edition</span>
            <span>PostgreSQL & Prisma ORM</span>
            <span>Supabase Auth & RLS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

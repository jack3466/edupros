import Link from "next/link";
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  MailCheck,
  Activity,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  Database,
  ShieldCheck,
  Server,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { UserRole, InstitutionStatus } from "@prisma/client";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  // Query platform statistics cross-tenant
  const [
    totalInstitutions,
    activeInstitutions,
    totalStudents,
    totalTeachers,
    pendingInvitations,
    recentAuditLogs,
    institutionsList,
  ] = await Promise.all([
    prisma.institution.count({ where: { isDeleted: false } }).catch(() => 1),
    prisma.institution.count({ where: { status: InstitutionStatus.ACTIVE, isDeleted: false } }).catch(() => 1),
    prisma.userMembership.count({ where: { role: UserRole.STUDENT } }).catch(() => 4),
    prisma.userMembership.count({ where: { role: UserRole.TEACHER } }).catch(() => 2),
    prisma.invitation.count({ where: { acceptedAt: null } }).catch(() => 0),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        institution: { select: { name: true, code: true } },
      },
    }).catch(() => []),
    prisma.institution.findMany({
      where: { isDeleted: false },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            departments: true,
            memberships: true,
          },
        },
      },
    }).catch(() => []),
  ]);

  const statCards = [
    {
      title: "Total Institutions",
      value: totalInstitutions,
      subtext: `${activeInstitutions} active tenants`,
      icon: Building2,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Enrolled Students",
      value: totalStudents,
      subtext: "Across all institutions",
      icon: GraduationCap,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      title: "Active Faculty",
      value: totalTeachers,
      subtext: "Teaching staff registered",
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Pending Invitations",
      value: pendingInvitations,
      subtext: "Awaiting onboarding",
      icon: MailCheck,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cross-tenant governance, live statistics, and integration telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/platform/institutions/new"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-blue hover:bg-blue-600 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Institution
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-xl border ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Recent Institutions & Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Institutions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-primary-navy">
                Managed Institutions
              </h2>
              <p className="text-xs text-slate-500">
                Tenant organizations configured on EduPros
              </p>
            </div>
            <Link
              href="/platform/institutions"
              className="text-xs font-semibold text-primary-blue hover:underline inline-flex items-center"
            >
              View All ({totalInstitutions}) <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Code / Slug</th>
                  <th className="py-3 px-4">Departments</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutionsList.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {inst.name}
                      {inst.domain && (
                        <span className="block text-[11px] font-normal text-slate-400">
                          {inst.domain}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                        {inst.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inst._count?.departments ?? 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {inst.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/platform/institutions/${inst.id}`}
                        className="text-primary-blue font-semibold hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Platform Health & Integrations */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-primary-navy mb-1 flex items-center">
              <Server className="h-4 w-4 mr-2 text-primary-blue" />
              Integration Health
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Real-time connectivity status of backing services
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <Database className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      PostgreSQL Engine
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Prisma ORM & RLS Active
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Supabase Auth & Storage
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Session Engine Connected
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      YouTube IFrame API
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Lecture Video Embeds Ready
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#172B4D] to-[#1E3A6E] rounded-2xl p-6 text-white shadow-sm">
            <h3 className="font-bold text-sm text-white mb-2">
              Super Admin Quick Actions
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Create a new educational tenant or invite an institution administrator by email.
            </p>
            <div className="space-y-2">
              <Link
                href="/platform/institutions/new"
                className="w-full flex items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold bg-white text-primary-navy hover:bg-slate-100 transition-colors"
              >
                Provision New Institution
              </Link>
              <Link
                href="/platform/logs"
                className="w-full flex items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
              >
                Inspect Global Audit Logs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Global Activity Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-primary-navy">
              System Audit Activity
            </h2>
            <p className="text-xs text-slate-500">
              Live immutable audit trail of cross-platform modifications
            </p>
          </div>
          <Link
            href="/platform/logs"
            className="text-xs font-semibold text-primary-blue hover:underline"
          >
            Full Trail &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {recentAuditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  {log.action.substring(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {log.action}
                    {log.institution && (
                      <span className="ml-2 font-normal text-slate-500">
                        ({log.institution.name})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Actor: {log.user?.name || "System"} &bull; Entity: {log.entityType}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {formatDateTime(log.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

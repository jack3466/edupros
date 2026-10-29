import Link from "next/link";
import { Plus, Building2, Search, ExternalLink, Power } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toggleInstitutionStatus } from "./actions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InstitutionsPage() {
  const institutions = await prisma.institution.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      settings: true,
      _count: {
        select: {
          departments: true,
          memberships: true,
          examinations: true,
        },
      },
      memberships: {
        where: { role: "INSTITUTION_ADMIN" },
        include: {
          user: { select: { name: true, email: true } },
        },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
            Educational Institutions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage, configure, and provision tenant organizations.
          </p>
        </div>

        <Link
          href="/platform/institutions/new"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-blue hover:bg-blue-600 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Provision Institution
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter institutions..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Tenants: <span className="font-bold text-slate-800">{institutions.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">Code / Slug</th>
                <th className="py-3 px-4">Primary Admin</th>
                <th className="py-3 px-4">Academic Units</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {institutions.map((inst) => {
                const primaryAdmin = inst.memberships[0]?.user;
                return (
                  <tr key={inst.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{
                            backgroundColor: inst.settings?.primaryColor || "#172B4D",
                          }}
                        >
                          {inst.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{inst.name}</span>
                          {inst.domain && (
                            <span className="block text-[11px] font-normal text-slate-400">
                              {inst.domain}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {inst.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {primaryAdmin ? (
                        <div>
                          <div className="font-medium text-slate-800">
                            {primaryAdmin.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {primaryAdmin.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None assigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{inst._count.departments} Departments</div>
                      <div className="text-[10px] text-slate-400">
                        {inst._count.memberships} Enrolled Users
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inst.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {inst.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(inst.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <form
                          action={toggleInstitutionStatus.bind(
                            null,
                            inst.id,
                            inst.status
                          )}
                        >
                          <button
                            type="submit"
                            title={
                              inst.status === "ACTIVE"
                                ? "Suspend Tenant"
                                : "Activate Tenant"
                            }
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              inst.status === "ACTIVE"
                                ? "border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

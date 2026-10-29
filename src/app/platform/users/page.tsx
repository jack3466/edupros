import { Users, Search, Shield, Building2, BookOpen, GraduationCap, Power } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; search?: string };
}) {
  const roleFilter = searchParams.role;
  const searchQuery = searchParams.search;

  const users = await prisma.user.findMany({
    where: {
      ...(searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(roleFilter
        ? {
            memberships: {
              some: { role: roleFilter as any },
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: {
          institution: true,
        },
      },
      studentProfile: true,
      teacherProfile: true,
    },
  });

  async function toggleUserStatus(userId: string, currentActive: boolean) {
    "use server";
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !currentActive },
    });
    revalidatePath("/platform/users");
  }

  const roleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
            <Shield className="h-3 w-3 mr-1" /> Super Admin
          </span>
        );
      case "INSTITUTION_ADMIN":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
            <Building2 className="h-3 w-3 mr-1" /> Inst. Admin
          </span>
        );
      case "TEACHER":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            <BookOpen className="h-3 w-3 mr-1" /> Teacher
          </span>
        );
      case "STUDENT":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
            <GraduationCap className="h-3 w-3 mr-1" /> Student
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Platform User Governance
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Directory of all administrators, faculty members, and students across tenants.
        </p>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Users: <span className="font-bold text-slate-900">{users.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role & Institution</th>
                <th className="py-3 px-4">Identifier</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const membership = user.memberships[0];
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{user.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">
                        {user.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {user.isSuperAdmin && roleBadge("SUPER_ADMIN")}
                        {user.memberships.map((m) => (
                          <div key={m.id} className="flex items-center space-x-1.5">
                            {roleBadge(m.role)}
                            <span className="text-[11px] text-slate-500">
                              @{m.institution.code}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {user.studentProfile?.rollNumber ||
                        user.teacherProfile?.employeeId ||
                        "SYS"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {user.isActive ? "ACTIVE" : "DEACTIVATED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!user.isSuperAdmin && (
                        <form action={toggleUserStatus.bind(null, user.id, user.isActive)}>
                          <button
                            type="submit"
                            title={user.isActive ? "Deactivate User" : "Activate User"}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              user.isActive
                                ? "border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      )}
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

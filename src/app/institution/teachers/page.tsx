import { BookOpen, Search, Plus, UserPlus, GraduationCap, Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { createTeacherAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const [teachers, departments] = await Promise.all([
    prisma.teacherProfile.findMany({
      where: { department: { institutionId } },
      include: {
        user: true,
        department: true,
        assignments: {
          include: { subject: { include: { class: true } } },
        },
      },
      orderBy: { employeeId: "asc" },
    }),
    prisma.department.findMany({
      where: { institutionId },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Faculty & Teaching Staff
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage teacher profiles, department affiliations, and subject assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Faculty Directory Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search faculty..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total Faculty: <span className="font-bold text-slate-900">{teachers.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Courses</th>
                  <th className="py-3 px-4">Qualifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{teacher.user.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">
                        {teacher.user.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {teacher.employeeId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {teacher.department?.name || "General"}
                    </td>
                    <td className="py-3.5 px-4">
                      {teacher.assignments.length === 0 ? (
                        <span className="text-amber-600 italic">No courses assigned</span>
                      ) : (
                        <div className="space-y-1">
                          {teacher.assignments.map((a) => (
                            <div key={a.id} className="font-mono text-[11px] text-slate-800">
                              &bull; {a.subject.name} ({a.subject.code})
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      <div>{teacher.qualification || "—"}</div>
                      <div className="text-[10px] text-slate-400">
                        {teacher.specialization || ""}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Onboard New Faculty Member */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
            <UserPlus className="h-4 w-4 mr-2 text-primary-blue" />
            Onboard Faculty Member
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Register a teacher and assign department credentials.
          </p>

          <form action={createTeacherAction} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Prof. Dev Patel"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="e.g. dev.patel@apex.edu"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  name="employeeId"
                  required
                  placeholder="e.g. EMP-ECE-03"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  name="departmentId"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Academic Qualification
              </label>
              <input
                type="text"
                name="qualification"
                placeholder="e.g. Ph.D. in Computer Vision"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Specialization / Research Area
              </label>
              <input
                type="text"
                name="specialization"
                placeholder="e.g. Embedded Systems & FPGA"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer mt-2"
            >
              Onboard Teacher
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

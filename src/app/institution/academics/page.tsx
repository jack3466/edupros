import { Plus, Layers, BookOpen, Users, GraduationCap, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import {
  createDepartmentAction,
  createClassAction,
  createSubjectAction,
  assignTeacherSubjectAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AcademicsPage() {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const [departments, academicYears, classes, subjects, teachers] =
    await Promise.all([
      prisma.department.findMany({
        where: { institutionId },
        include: {
          _count: { select: { classes: true, subjects: true, teachers: true } },
        },
      }),
      prisma.academicYear.findMany({
        where: { institutionId },
        include: { semesters: true },
      }),
      prisma.class.findMany({
        where: { department: { institutionId } },
        include: {
          department: true,
          semester: true,
          _count: { select: { enrollments: true, subjects: true } },
        },
      }),
      prisma.subject.findMany({
        where: { department: { institutionId } },
        include: {
          department: true,
          class: true,
          teacherAssignments: {
            include: { teacherProfile: { include: { user: true } } },
          },
        },
      }),
      prisma.teacherProfile.findMany({
        where: { department: { institutionId } },
        include: { user: true, department: true },
      }),
    ]);

  const currentSemester = academicYears[0]?.semesters[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Academic Architecture
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Departments, classes, curriculum subjects, and faculty assignments.
        </p>
      </div>

      {/* Grid: Departments & Fast Create Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Departments Directory */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-primary-navy flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-primary-blue" />
                Departments ({departments.length})
              </h2>
              <p className="text-xs text-slate-500">
                Academic faculties operating within the institution
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-2">
                      {dept.name}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{dept._count.classes} Classes</span>
                  <span>{dept._count.subjects} Subjects</span>
                  <span>{dept._count.teachers} Faculty</span>
                </div>
              </div>
            ))}
          </div>

          {/* New Department Inline Form */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Add New Department
            </h3>
            <form action={createDepartmentAction} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                name="name"
                required
                placeholder="Department Name (e.g. Mechanical Engineering)"
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
              <input
                type="text"
                name="code"
                required
                placeholder="Code (e.g. MECH)"
                className="px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors"
              >
                Create Department
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Add Class & Add Subject Forms */}
        <div className="space-y-6">
          {/* Create Class Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
              <Layers className="h-4 w-4 mr-2 text-primary-blue" />
              Create Class & Section
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a class cohort under a department
            </p>

            <form action={createClassAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department
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

              {currentSemester && (
                <input type="hidden" name="semesterId" value={currentSemester.id} />
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. CSE-4B"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    required
                    placeholder="e.g. B"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Max Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  defaultValue="60"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg font-semibold text-white bg-primary-blue hover:bg-blue-600 transition-colors shadow-sm"
              >
                Add Class
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Curriculum Subjects & Teacher Allocations */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-primary-navy flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-primary-blue" />
              Curriculum Subjects & Faculty Assignments
            </h2>
            <p className="text-xs text-slate-500">
              List of registered courses and the primary assigned faculty instructor
            </p>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Class</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Assigned Faculty</th>
                <th className="py-3 px-4 text-right">Assign Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => {
                const assignedTeacher = sub.teacherAssignments[0]?.teacherProfile?.user;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {sub.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                        {sub.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {sub.department.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {sub.class?.name || "All Sections"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {sub.creditHours} Credits
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {assignedTeacher ? (
                        <div className="flex items-center text-emerald-700">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          {assignedTeacher.name}
                        </div>
                      ) : (
                        <span className="text-amber-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <form action={assignTeacherSubjectAction} className="inline-flex items-center space-x-1.5">
                        <input type="hidden" name="subjectId" value={sub.id} />
                        <select
                          name="teacherProfileId"
                          required
                          className="px-2 py-1 text-[11px] border border-slate-200 rounded bg-white focus:outline-none"
                        >
                          <option value="">Select Faculty...</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.user.name} ({t.employeeId})
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-primary-blue hover:text-white text-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          Assign
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Subject Inline Form */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Register New Course Subject
          </h3>
          <form action={createSubjectAction} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <select
              name="departmentId"
              required
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="name"
              required
              placeholder="Subject Name (e.g. Operating Systems)"
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
            <input
              type="text"
              name="code"
              required
              placeholder="Code (e.g. CS401)"
              className="px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
            <input
              type="number"
              name="creditHours"
              defaultValue="3"
              min="1"
              max="6"
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm"
            >
              Register Subject
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

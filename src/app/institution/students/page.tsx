import Link from "next/link";
import { GraduationCap, FileSpreadsheet, Plus, Search, UserCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import { createStudentAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const [students, classes] = await Promise.all([
    prisma.studentProfile.findMany({
      where: {
        enrollments: {
          some: { class: { department: { institutionId } } },
        },
      },
      include: {
        user: true,
        enrollments: { include: { class: { include: { department: true } } } },
        attendanceRecords: true,
      },
      orderBy: { rollNumber: "asc" },
    }),
    prisma.class.findMany({
      where: { department: { institutionId } },
      include: { department: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
            Student Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Student profiles, class enrollments, and bulk admissions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/institution/students/import"
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Bulk CSV/Excel Import
          </Link>
        </div>
      </div>

      {/* Grid: Students Table & Quick Enrollment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Registry Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total Students: <span className="font-bold text-slate-900">{students.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Enrolled Class</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Guardian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const enrollment = student.enrollments[0];
                  const total = student.attendanceRecords.length;
                  const attended = student.attendanceRecords.filter(
                    (r) => r.status === "PRESENT"
                  ).length;
                  const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
                  const isShortage = pct < 75;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{student.user.name}</div>
                        <div className="text-[11px] font-normal text-slate-400">
                          {student.user.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {student.rollNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {enrollment?.class ? (
                          <div>
                            <span className="font-semibold text-slate-900">
                              {enrollment.class.name}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {enrollment.class.department.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Enrolled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`font-bold ${
                              isShortage ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {pct}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({attended}/{total})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        <div>{student.guardianName || "—"}</div>
                        <div className="text-slate-400 font-mono text-[10px]">
                          {student.guardianPhone || ""}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Single Student Enrollment */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-sm font-bold text-primary-navy mb-1 flex items-center">
            <UserCheck className="h-4 w-4 mr-2 text-primary-blue" />
            Enroll Single Student
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Create an individual student record and allocate to a class cohort.
          </p>

          <form action={createStudentAction} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Diya Sengupta"
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
                placeholder="e.g. diya@apex.edu"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  required
                  placeholder="e.g. CSE-2025-005"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Class Cohort *
                </label>
                <select
                  name="classId"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.department.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Guardian Full Name
              </label>
              <input
                type="text"
                name="guardianName"
                placeholder="e.g. Amit Sengupta"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Guardian Phone
              </label>
              <input
                type="text"
                name="guardianPhone"
                placeholder="e.g. +1-555-0102"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer mt-2"
            >
              Enroll Student
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

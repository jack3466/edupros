"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Clock, HelpCircle, Save } from "lucide-react";
import { recordAttendanceSessionAction } from "../actions";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  classId: string;
  className: string;
  students: {
    id: string;
    name: string;
    rollNumber: string;
  }[];
}

export default function TakeAttendanceClient({
  subjects,
  initialSubjectId,
}: {
  subjects: SubjectOption[];
  initialSubjectId?: string;
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ""
  );

  const activeSubject =
    subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const students = activeSubject?.students || [];

  // Attendance status dictionary: studentProfileId -> PRESENT | ABSENT | PARTIAL | EXCUSED
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    students.forEach((s) => {
      initial[s.id] = "PRESENT";
    });
    return initial;
  });

  const handleStatusChange = (studentId: string, status: string) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: string) => {
    const updated: Record<string, string> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setStatuses(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/teacher/attendance"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Sessions
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h1 className="text-xl font-bold text-primary-navy">
            Record Live Class Attendance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log student attendance records directly into the official session database.
          </p>
        </div>

        <form action={recordAttendanceSessionAction} className="space-y-6">
          <input
            type="hidden"
            name="classId"
            value={activeSubject?.classId || ""}
          />

          {/* Session Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Course Subject *
              </label>
              <select
                name="subjectId"
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  const newSub = subjects.find((s) => s.id === e.target.value);
                  const reset: Record<string, string> = {};
                  newSub?.students.forEach((s) => {
                    reset[s.id] = "PRESENT";
                  });
                  setStatuses(reset);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) - {s.className}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Session Date *
              </label>
              <input
                type="date"
                name="sessionDate"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Topic Covered
              </label>
              <input
                type="text"
                name="topicCovered"
                placeholder="e.g. Graph Traversals BFS & DFS"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>
          </div>

          {/* Attendance Sheet */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Student Roll Call ({students.length} Candidates)
                </h3>
                <p className="text-xs text-slate-400">
                  Click status pill to mark Present, Absent, or Excused.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => markAll("PRESENT")}
                  className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll("ABSENT")}
                  className="px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold hover:bg-rose-100"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">Roll Number</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const currentStatus = statuses[student.id] || "PRESENT";
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {student.rollNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {student.name}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="hidden"
                            name={`status_${student.id}`}
                            value={currentStatus}
                          />

                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, "PRESENT")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                currentStatus === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, "ABSENT")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                currentStatus === "ABSENT"
                                  ? "bg-rose-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, "EXCUSED")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                currentStatus === "EXCUSED"
                                  ? "bg-amber-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Excused
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <Link
              href="/teacher/attendance"
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-primary-navy hover:bg-slate-800 transition-colors shadow-sm cursor-pointer flex items-center"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Attendance Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

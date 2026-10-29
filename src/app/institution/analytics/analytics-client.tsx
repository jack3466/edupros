"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, TrendingUp, Users, Award, ShieldAlert } from "lucide-react";

interface AnalyticsProps {
  deptData: { name: string; students: number; classes: number }[];
  attendanceBreakdown: { name: string; value: number; color: string }[];
  examScoresData: { subject: string; averageScore: number; passRate: number }[];
}

export default function AnalyticsClient({
  deptData,
  attendanceBreakdown,
  examScoresData,
}: AnalyticsProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Institutional Analytics & Performance
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Real-time analytics on attendance compliance, assessment distributions, and departmental scale.
        </p>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Size Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-primary-navy flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary-blue" />
                Department Student Enrollments
              </h2>
              <p className="text-xs text-slate-500">
                Number of registered students enrolled per department
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#172B4D",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="students" fill="#3478D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Compliance Ratio */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-primary-navy flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-emerald-600" />
                Attendance Compliance Ratio (&gt;= 75% vs &lt; 75%)
              </h2>
              <p className="text-xs text-slate-500">
                Ratio of students meeting institutional attendance thresholds
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#172B4D",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center space-x-6 text-xs font-semibold mt-2">
            {attendanceBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700">
                  {item.name}: {item.value} students
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Examination Performance */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-base font-bold text-primary-navy mb-1 flex items-center">
          <Award className="h-4 w-4 mr-2 text-primary-blue" />
          Examination Score Performance by Subject
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Average student score (%) across published assessments
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={examScoresData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#172B4D",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="averageScore" fill="#21966A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Building2, Shield, Sparkles } from "lucide-react";
import { createInstitutionAction } from "../actions";

export default function NewInstitutionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/platform/institutions"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Institutions
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-50 text-primary-blue text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Multi-Tenant Tenant Provisioning</span>
          </div>
          <h1 className="text-xl font-bold text-primary-navy">
            Provision New Educational Institution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure tenant isolation parameters, academic defaults, and assign the primary administrator.
          </p>
        </div>

        <form action={createInstitutionAction} className="space-y-6">
          {/* Section 1: Institution Details */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-primary-blue" />
              1. Institutional Identity
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Apex Institute of Technology"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unique Code *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="e.g. AIT"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:ring-1 focus:ring-primary-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="e.g. apex-institute"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg lowercase focus:ring-1 focus:ring-primary-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Email Domain (Optional)
                </label>
                <input
                  type="text"
                  name="domain"
                  placeholder="e.g. apex.edu"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-blue focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Thresholds */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              2. Academic Policies & Thresholds
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Attendance Requirement (%)
                </label>
                <input
                  type="number"
                  name="minAttendancePercent"
                  defaultValue="75"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-blue focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Students below this percentage will be flagged with shortage warnings.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Exam Pass Percentage (%)
                </label>
                <input
                  type="number"
                  name="passPercentage"
                  defaultValue="40"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-blue focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Passing mark threshold for examination grading.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Primary Administrator */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-primary-navy" />
              3. Institution Administrator Account
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Administrator Full Name *
                </label>
                <input
                  type="text"
                  name="adminName"
                  required
                  placeholder="e.g. Dr. Eleanor Vance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Administrator Email *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  required
                  placeholder="e.g. admin@apex.edu"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-blue focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <Link
              href="/platform/institutions"
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-primary-blue hover:bg-blue-600 transition-colors shadow-sm cursor-pointer"
            >
              Provision Institution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import Link from "next/link";
import { GraduationCap, Shield, Building2, BookOpen, User, ArrowRight, Lock } from "lucide-react";
import { loginWithEmail, switchDemoRole } from "@/app/api/auth/actions";
import { UserRole } from "@prisma/client";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="h-12 w-12 rounded-xl bg-primary-navy flex items-center justify-center text-white shadow-md">
            <GraduationCap className="h-7 w-7" />
          </div>
          <span className="text-2xl font-black tracking-tight text-primary-navy">
            EDUPROS
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Your Academic Portal
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Access your institution dashboard, classes, or records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Email / Password Form */}
          <form action={loginWithEmail} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-1"
              >
                Institutional Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@apex.edu"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary-blue hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-navy hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-navy transition-colors cursor-pointer"
              >
                <Lock className="h-4 w-4 mr-2" />
                Sign In
              </button>
            </div>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Instant Role Switcher (Seeded Demo Accounts)
              </span>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                1-Click Testing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <form action={switchDemoRole.bind(null, UserRole.SUPER_ADMIN)}>
                <button
                  type="submit"
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-xs group cursor-pointer"
                >
                  <div className="flex items-center text-indigo-700 font-semibold mb-0.5">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Super Admin
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Alexander Vance
                  </div>
                </button>
              </form>

              <form action={switchDemoRole.bind(null, UserRole.INSTITUTION_ADMIN)}>
                <button
                  type="submit"
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-xs group cursor-pointer"
                >
                  <div className="flex items-center text-blue-700 font-semibold mb-0.5">
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    Inst. Admin
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Dr. Eleanor Vance
                  </div>
                </button>
              </form>

              <form action={switchDemoRole.bind(null, UserRole.TEACHER)}>
                <button
                  type="submit"
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs group cursor-pointer"
                >
                  <div className="flex items-center text-emerald-700 font-semibold mb-0.5">
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    Teacher
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Prof. Rajesh Sharma
                  </div>
                </button>
              </form>

              <form action={switchDemoRole.bind(null, UserRole.STUDENT)}>
                <button
                  type="submit"
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-xs group cursor-pointer"
                >
                  <div className="flex items-center text-amber-700 font-semibold mb-0.5">
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Student
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Aarav Mehta
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-primary-navy inline-flex items-center"
          >
            &larr; Back to EduPros Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

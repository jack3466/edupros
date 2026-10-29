import Link from "next/link";
import { GraduationCap, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="h-10 w-10 rounded-xl bg-primary-navy flex items-center justify-center text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-primary-navy">
            EDUPROS
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter your institutional email address and we will send you a secure password reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                Institutional Email
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@apex.edu"
                className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-blue hover:bg-blue-600 transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Recovery Email
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-primary-navy hover:underline inline-flex items-center"
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

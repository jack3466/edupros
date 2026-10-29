import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { logout } from "@/app/api/auth/actions";

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reasonText: Record<string, string> = {
    platform_admin_only: "Only Platform Super Administrators have access to the global control plane.",
    institution_admin_only: "Only Institution Administrators can access this governance area.",
    faculty_only: "This section is restricted to authorized faculty and teaching staff.",
    students_only: "This portal is reserved for registered students.",
    cross_tenant_access_denied: "Cross-tenant access violation: You are not authorized to view records from another institution.",
  };

  const explanation =
    reasonText[searchParams.reason || ""] ||
    "You do not have the required permissions or institutional role to view this page.";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {explanation}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex justify-center items-center px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Link>
          <form action={logout} className="flex-1">
            <button
              type="submit"
              className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-lg border border-transparent text-sm font-medium text-white bg-primary-navy hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

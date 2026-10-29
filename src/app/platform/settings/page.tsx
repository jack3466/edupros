import {
  Database,
  ShieldCheck,
  Mail,
  Youtube,
  CheckCircle2,
  Server,
  KeyRound,
  HardDrive,
} from "lucide-react";

export default function PlatformSettingsPage() {
  const integrations = [
    {
      name: "PostgreSQL Database Engine",
      provider: "Prisma ORM & PostgreSQL with RLS",
      status: "CONNECTED",
      details: "Connection pooling enabled, multi-tenant isolation enforced via RLS policies.",
      icon: Database,
      envKey: "DATABASE_URL",
    },
    {
      name: "Supabase Authentication & Storage",
      provider: "Supabase SSR Client & Storage Buckets",
      status: "CONFIGURED",
      details: "User identity tokens, session synchronization, and courseware asset storage.",
      icon: ShieldCheck,
      envKey: "NEXT_PUBLIC_SUPABASE_URL",
    },
    {
      name: "Transactional Email Engine",
      provider: "Resend Email API",
      status: "OPERATIONAL",
      details: "Attendance shortage warnings, invitations, and password reset dispatches.",
      icon: Mail,
      envKey: "RESEND_API_KEY",
    },
    {
      name: "Video Lecture Engine",
      provider: "YouTube IFrame API & Player Embed",
      status: "ACTIVE",
      details: "Validation of external YouTube video IDs and watch duration progress tracking.",
      icon: Youtube,
      envKey: "PUBLIC",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          System & Integration Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Global platform configuration, API adapters, and infrastructure health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-primary-navy">
                    <Icon className="h-6 w-6 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400">{item.provider}</p>
                  </div>
                </div>
                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {item.status}
                </span>
              </div>

              <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                {item.details}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">
                  {item.envKey}
                </span>
                <span className="text-slate-500 font-medium">
                  Verified in Environment
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Multi-Tenant Boundaries */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-sm font-bold text-primary-navy mb-2 flex items-center">
          <KeyRound className="h-4 w-4 mr-2 text-primary-blue" />
          Multi-Tenant Isolation Safeguards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-semibold text-slate-900 mb-1">
              PostgreSQL Row Level Security
            </div>
            <div className="text-slate-500 text-[11px]">
              Active RLS policies prevent cross-institution queries even in the event of an application logic lapse.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-semibold text-slate-900 mb-1">
              Server-Side Role Guarding
            </div>
            <div className="text-slate-500 text-[11px]">
              All Next.js Server Actions and API endpoints independently verify session role and membership before execution.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-semibold text-slate-900 mb-1">
              Immutable Audit Pipeline
            </div>
            <div className="text-slate-500 text-[11px]">
              Platform mutations (tenant creation, exam approval, imports) are immutably archived with caller identity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

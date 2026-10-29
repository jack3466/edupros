import { Activity, Shield, Filter, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformLogsPage() {
  const logs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      institution: { select: { name: true, code: true } },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-navy">
          Global Audit Trail
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Immutable system log capturing cross-tenant administrative actions and security events.
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Recorded Events ({logs.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Tamper-proof storage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Context Metadata</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {log.user ? (
                      <div>
                        <div className="font-medium text-slate-800">
                          {log.user.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.user.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">System Automation</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {log.institution ? (
                      <span className="font-semibold text-primary-navy">
                        {log.institution.name} ({log.institution.code})
                      </span>
                    ) : (
                      <span className="text-slate-400">Global Platform</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    {log.entityType} {log.entityId && `(${log.entityId.substring(0, 8)}...)`}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px] max-w-xs truncate">
                    {log.metadataJson || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                    {formatDateTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

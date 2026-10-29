import { prisma } from "@/lib/prisma";

export interface LogAuditParams {
  institutionId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Record a critical mutation event into the immutable AuditLog
   */
  static async record(params: LogAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          institutionId: params.institutionId ?? null,
          userId: params.userId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });
    } catch (error) {
      // In production, we log to stdout or telemetry so an audit failure does not break the main transaction
      console.error("[AuditService] Failed to record audit log:", error);
      return null;
    }
  }

  /**
   * Query recent audit logs with pagination and filters
   */
  static async getRecentLogs({
    institutionId,
    limit = 50,
    offset = 0,
    action,
    entityType,
  }: {
    institutionId?: string;
    limit?: number;
    offset?: number;
    action?: string;
    entityType?: string;
  }) {
    const where: {
      institutionId?: string;
      action?: string;
      entityType?: string;
    } = {};

    if (institutionId) where.institutionId = institutionId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          institution: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}

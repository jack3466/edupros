import { PrismaClient } from "@prisma/client";
import { mockPrisma } from "./mock-prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

// In local development when Postgres is offline, mockPrisma provides a zero-latency,
// fully relational in-memory database populated with Apex Institute of Technology seed data.
const isPostgresLocal =
  process.env.DATABASE_URL?.includes("localhost:5432") ||
  process.env.DATABASE_URL?.includes("127.0.0.1:5432");

const shouldUseMock =
  process.env.USE_MOCK_STORE === "true" ||
  (process.env.ENABLE_MOCK_AUTH === "true" && isPostgresLocal) ||
  !process.env.DATABASE_URL;

let prismaInstance: any;

if (shouldUseMock) {
  prismaInstance = mockPrisma;
} else {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

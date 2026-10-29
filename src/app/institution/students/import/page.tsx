import { prisma } from "@/lib/prisma";
import { requireInstitutionAdmin } from "@/lib/auth/guards";
import BulkImportClient from "./bulk-import-client";

export const dynamic = "force-dynamic";

export default async function BulkImportPage() {
  const session = await requireInstitutionAdmin();
  const institutionId = session.institutionId;

  const classes = await prisma.class.findMany({
    where: { department: { institutionId } },
    include: { department: true },
    orderBy: { name: "asc" },
  });

  const classOptions = classes.map((c) => ({
    id: c.id,
    name: c.name,
    deptCode: c.department.code,
  }));

  return <BulkImportClient classes={classOptions} />;
}

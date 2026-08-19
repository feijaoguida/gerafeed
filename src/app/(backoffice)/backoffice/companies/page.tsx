import { prisma } from "@/lib/prisma";
import { CompanyList } from "@/components/backoffice/company-list";

export default async function BackofficeCompaniesPage() {
  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">
      <CompanyList initialPlans={plans} />
    </div>
  );
}


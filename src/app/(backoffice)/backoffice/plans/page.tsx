import { prisma } from "@/lib/prisma";
import { PlanManager } from "@/components/backoffice/plan-manager";

export default async function BackofficePlansPage() {
  const [plans, features] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { price: "asc" },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
    }),
    prisma.feature.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">
      <PlanManager
        initialPlans={JSON.parse(JSON.stringify(plans))}
        initialFeatures={JSON.parse(JSON.stringify(features))}
      />
    </div>
  );
}


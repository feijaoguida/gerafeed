import { prisma } from "@/lib/prisma";
import { CouponManager } from "@/components/backoffice/coupon-manager";

export default async function BackofficeCouponsPage() {
  const [coupons, availablePlans] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        plans: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                monthlyPrice: true,
                periodicity: true,
              },
            },
          },
        },
        _count: {
          select: { redemptions: true },
        },
      },
    }),
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { monthlyPrice: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        monthlyPrice: true,
        periodicity: true,
      },
    }),
  ]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">
      <CouponManager
        initialCoupons={JSON.parse(JSON.stringify(coupons))}
        availablePlans={JSON.parse(JSON.stringify(availablePlans))}
      />
    </div>
  );
}


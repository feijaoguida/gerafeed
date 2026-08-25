import { prisma } from "@/lib/prisma";

export const DEFAULT_AFFILIATE_PROGRAMS = [
  {
    code: "MERCADO_LIVRE",
    name: "Mercado Livre",
    providerType: "MERCADO_LIVRE",
    active: true,
  },
];

export async function ensureDefaultAffiliatePrograms() {
  for (const prog of DEFAULT_AFFILIATE_PROGRAMS) {
    await prisma.affiliateProgram.upsert({
      where: { code: prog.code },
      update: {
        name: prog.name,
        providerType: prog.providerType,
        active: prog.active,
      },
      create: prog,
    });
  }
}

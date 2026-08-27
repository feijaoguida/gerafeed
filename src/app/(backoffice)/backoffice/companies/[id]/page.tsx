import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CompanyDetails } from "@/components/backoffice/company-details";

export default async function BackofficeCompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [workspace, plans] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        billingProfile: true,
        invoices: {
          orderBy: { createdAt: "desc" },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
        sources: {
          include: {
            wordpressSiteSources: {
              include: {
                wordpressSite: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        wordpressSites: true,
        configurations: true,
      },
    }),
    prisma.plan.findMany({
      orderBy: { price: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        maxArticles: true,
        maxSources: true,
      },
    }),
  ]);

  if (!workspace) {
    notFound();
  }

  // Calculate usage stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [articlesProcessedThisMonth, totalArticlesCount] = await Promise.all([
    prisma.article.count({
      where: {
        workspaceId: id,
        processedAt: {
          not: null,
          gte: startOfMonth,
        },
      },
    }),
    prisma.article.count({
      where: { workspaceId: id },
    }),
  ]);

  // Sanitize WordPress sites (secrets protection)
  const sanitizedWordPressSites = workspace.wordpressSites.map((site) => ({
    id: site.id,
    name: site.name,
    url: site.url,
    username: site.username,
    hasPassword: Boolean(site.encryptedApplicationPassword),
    defaultPromptType: site.defaultPromptType,
    active: site.active,
    createdAt: site.createdAt,
  }));

  // Sanitize configurations (secrets protection)
  const sanitizedConfigurations = workspace.configurations.map((cfg) => {
    const parsed =
      cfg.value && typeof cfg.value === "object" ? { ...(cfg.value as Record<string, unknown>) } : {};
    if ("apiKey" in parsed) {
      parsed.hasApiKey = Boolean(parsed.apiKey);
      delete parsed.apiKey;
    }
    if ("password" in parsed) {
      parsed.hasPassword = Boolean(parsed.password);
      delete parsed.password;
    }
    return {
      id: cfg.id,
      key: cfg.key,
      value: parsed,
      createdAt: cfg.createdAt,
      updatedAt: cfg.updatedAt,
    };
  });

  const workspaceData = {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    active: workspace.active,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    subscription: workspace.subscription,
    members: workspace.members,
    sources: workspace.sources,
    wordpressSites: sanitizedWordPressSites,
    configurations: sanitizedConfigurations,
    stats: {
      articlesProcessedThisMonth,
      totalArticlesCount,
      activeSourcesCount: workspace.sources.filter((s) => s.active).length,
      totalSourcesCount: workspace.sources.length,
      wordpressCount: workspace.wordpressSites.length,
      membersCount: workspace.members.length,
      maxArticles: workspace.subscription?.plan?.maxArticles ?? 50,
      maxSources: workspace.subscription?.plan?.maxSources ?? 3,
    },
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">
      <CompanyDetails
        initialWorkspace={JSON.parse(JSON.stringify(workspaceData))}
        availablePlans={JSON.parse(JSON.stringify(plans))}
      />
    </div>
  );
}

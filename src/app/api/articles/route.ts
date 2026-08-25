import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, Prisma } from "@prisma/client";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { CommercialArticleType } from "@/lib/affiliate";


export async function GET(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { searchParams } = new URL(request.url);

    const statusParam = searchParams.get("status");
    const sourceIdParam = searchParams.get("sourceId") || searchParams.get("feed");
    const wordpressSiteIdParam = searchParams.get("wordpressSiteId") || searchParams.get("wordpress");
    const commercialTypeParam = searchParams.get("commercialType");
    const isAffiliateParam = searchParams.get("isAffiliate");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const whereClause: Prisma.ArticleWhereInput = {
      workspaceId,
    };

    // Filter by Status
    if (statusParam && ["PENDING", "PUBLISHED", "REJECTED"].includes(statusParam.toUpperCase())) {
      whereClause.status = statusParam.toUpperCase() as ArticleStatus;
    }

    // Filter by Commercial / Affiliate Type
    if (commercialTypeParam && commercialTypeParam.trim() && commercialTypeParam !== "ALL") {
      whereClause.commercialType = commercialTypeParam.toUpperCase() as CommercialArticleType;
    } else if (isAffiliateParam === "true") {
      whereClause.commercialType = { not: null };
    } else if (isAffiliateParam === "false") {
      whereClause.commercialType = null;
    }

    // Filter by Feed / Source
    if (sourceIdParam && sourceIdParam.trim() && sourceIdParam !== "ALL") {
      whereClause.sourceId = sourceIdParam.trim();
    }

    // Filter by WordPress Site
    if (wordpressSiteIdParam && wordpressSiteIdParam.trim() && wordpressSiteIdParam !== "ALL") {
      whereClause.wordpressSiteId = wordpressSiteIdParam.trim();
    }

    // Filter by Editorial Date (originalPublishedAt)
    if (startDateParam || endDateParam) {
      const dateFilter: Prisma.DateTimeNullableFilter = {};

      if (startDateParam && startDateParam.trim()) {
        const start = new Date(startDateParam.trim());
        if (!isNaN(start.getTime())) {
          dateFilter.gte = start;
        }
      }

      if (endDateParam && endDateParam.trim()) {
        const end = new Date(endDateParam.trim());
        if (!isNaN(end.getTime())) {
          // If date only (e.g. YYYY-MM-DD), set to end of day 23:59:59.999
          if (endDateParam.trim().length === 10) {
            end.setUTCHours(23, 59, 59, 999);
          }
          dateFilter.lte = end;
        }
      }

      if (dateFilter.gte || dateFilter.lte) {
        whereClause.originalPublishedAt = dateFilter;
      }
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        source: {
          select: { id: true, name: true, rssUrl: true, creditName: true },
        },
        wordpressSite: {
          select: { id: true, name: true, url: true },
        },
        suggestedCategory: {
          select: { id: true, name: true, slug: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json({ error: "Erro ao buscar notícias" }, { status: 500 });
  }
}

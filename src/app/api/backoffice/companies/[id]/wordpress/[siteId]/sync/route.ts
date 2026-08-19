import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { getWordPressSiteConfig } from "@/lib/wordpress-sites";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId, siteId } = await params;

    const config = await getWordPressSiteConfig(workspaceId, siteId);
    if (!config) {
      return NextResponse.json({ error: "Site WordPress não encontrado na empresa." }, { status: 404 });
    }

    if (!config.url || !config.username || !config.applicationPassword) {
      return NextResponse.json(
        { error: "Credenciais do WordPress não configuradas para este site." },
        { status: 400 }
      );
    }

    const credentials = `${config.username}:${config.applicationPassword}`;
    const base64Auth = Buffer.from(credentials).toString("base64");
    const headers = {
      Authorization: `Basic ${base64Auth}`,
      "Content-Type": "application/json",
    };

    const allCategories: Array<{ id: number; name: string; slug: string }> = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(`${config.url}/wp-json/wp/v2/categories?per_page=100&page=${page}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        return NextResponse.json(
          { error: `Erro ao buscar categorias do WordPress (${res.status}): ${errorText.substring(0, 200)}` },
          { status: 400 }
        );
      }

      const totalPagesHeader = res.headers.get("x-wp-totalpages");
      if (totalPagesHeader) {
        totalPages = parseInt(totalPagesHeader, 10) || 1;
      }

      const categories = (await res.json()) as Array<{ id: number; name: string; slug: string }>;
      for (const cat of categories) {
        allCategories.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        });
      }

      page++;
    } while (page <= totalPages);

    const synced = [];
    for (const cat of allCategories) {
      const upserted = await prisma.wordPressCategory.upsert({
        where: {
          workspaceId_wordpressId: {
            workspaceId,
            wordpressId: cat.id,
          },
        },
        update: {
          name: cat.name,
          slug: cat.slug,
          wordpressSiteId: siteId,
        },
        create: {
          workspaceId,
          wordpressSiteId: siteId,
          wordpressId: cat.id,
          name: cat.name,
          slug: cat.slug,
        },
      });
      synced.push(upserted);
    }

    return NextResponse.json({
      success: true,
      message: `${synced.length} categoria(s) sincronizadas com sucesso!`,
      syncedCount: synced.length,
      categories: synced,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao sincronizar categorias.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

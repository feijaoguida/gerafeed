import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  active?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  active?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export class ProductCategoryService {
  /**
   * Lists categories for a workspace, optionally filtered by active status.
   */
  static async listCategories(
    workspaceId: string,
    options?: { activeOnly?: boolean; includeChildren?: boolean }
  ) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const where: { workspaceId: string; active?: boolean } = { workspaceId };
    if (options?.activeOnly) {
      where.active = true;
    }

    return prisma.productCategory.findMany({
      where,
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: options?.includeChildren
          ? {
              select: { id: true, name: true, slug: true, active: true },
            }
          : false,
        _count: {
          select: { products: true, children: true },
        },
      },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    });
  }

  /**
   * Retrieves a category by ID with tenant isolation.
   */
  static async getCategory(workspaceId: string, categoryId: string) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, workspaceId },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new Error("Categoria de produto não encontrada no workspace.");
    }

    return category;
  }

  /**
   * Creates a new category with unique slug in workspace and hierarchy validation.
   */
  static async createCategory(workspaceId: string, input: CreateCategoryInput) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    if (!input.name || !input.name.trim()) {
      throw new Error("O nome da categoria é obrigatório.");
    }

    const trimmedName = input.name.trim();
    let baseSlug = input.slug ? slugify(input.slug) : slugify(trimmedName);
    if (!baseSlug) baseSlug = `cat-${Date.now()}`;

    // Verify parent exists and belongs to workspace
    if (input.parentId) {
      const parent = await prisma.productCategory.findFirst({
        where: { id: input.parentId, workspaceId },
      });
      if (!parent) {
        throw new Error("Categoria pai informada não existe neste workspace.");
      }
    }

    // Ensure unique slug per workspace
    let slugCandidate = baseSlug;
    let suffix = 1;
    while (true) {
      const existing = await prisma.productCategory.findFirst({
        where: { workspaceId, slug: slugCandidate },
      });
      if (!existing) break;
      slugCandidate = `${baseSlug}-${suffix++}`;
    }

    return prisma.productCategory.create({
      data: {
        workspaceId,
        name: trimmedName,
        slug: slugCandidate,
        description: input.description?.trim() || null,
        parentId: input.parentId || null,
        active: input.active !== undefined ? input.active : true,
      },
      include: {
        parent: true,
      },
    });
  }

  /**
   * Updates an existing category preventing circular hierarchy loops and slug collisions.
   */
  static async updateCategory(
    workspaceId: string,
    categoryId: string,
    input: UpdateCategoryInput
  ) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const existing = await prisma.productCategory.findFirst({
      where: { id: categoryId, workspaceId },
    });
    if (!existing) {
      throw new Error("Categoria de produto não encontrada no workspace.");
    }

    // Validate parent hierarchy and prevent circular references
    if (input.parentId !== undefined) {
      if (input.parentId === categoryId) {
        throw new Error("Uma categoria não pode ser pai de si mesma.");
      }

      if (input.parentId !== null) {
        const parent = await prisma.productCategory.findFirst({
          where: { id: input.parentId, workspaceId },
        });
        if (!parent) {
          throw new Error("Categoria pai informada não existe neste workspace.");
        }

        // Circular check: traverse up from parent to see if it leads to categoryId
        let currentParentId: string | null = parent.parentId;
        while (currentParentId) {
          if (currentParentId === categoryId) {
            throw new Error("Referência circular detectada: a categoria pai não pode ser descendente desta categoria.");
          }
          const nextParent = await prisma.productCategory.findUnique({
            where: { id: currentParentId },
            select: { parentId: true },
          });
          currentParentId = nextParent?.parentId || null;
        }
      }
    }

    // Handle slug update if name or slug changed
    let finalSlug = existing.slug;
    if (input.slug || input.name) {
      const baseSlug = slugify(input.slug || input.name || existing.name);
      if (baseSlug && baseSlug !== existing.slug) {
        let slugCandidate = baseSlug;
        let suffix = 1;
        while (true) {
          const collision = await prisma.productCategory.findFirst({
            where: {
              workspaceId,
              slug: slugCandidate,
              NOT: { id: categoryId },
            },
          });
          if (!collision) break;
          slugCandidate = `${baseSlug}-${suffix++}`;
        }
        finalSlug = slugCandidate;
      }
    }

    return prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        slug: finalSlug,
        description: input.description !== undefined ? input.description?.trim() || null : undefined,
        parentId: input.parentId !== undefined ? input.parentId : undefined,
        active: input.active !== undefined ? input.active : undefined,
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Deletes a category, detaching child categories and products safely.
   */
  static async deleteCategory(workspaceId: string, categoryId: string) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const existing = await prisma.productCategory.findFirst({
      where: { id: categoryId, workspaceId },
    });
    if (!existing) {
      throw new Error("Categoria de produto não encontrada no workspace.");
    }

    return prisma.$transaction(async (tx) => {
      // Reparent children to this category's parent (or null)
      await tx.productCategory.updateMany({
        where: { parentId: categoryId, workspaceId },
        data: { parentId: existing.parentId },
      });

      // Detach products
      await tx.product.updateMany({
        where: { categoryId, workspaceId },
        data: { categoryId: null },
      });

      return tx.productCategory.delete({
        where: { id: categoryId },
      });
    });
  }
}

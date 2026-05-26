import { prisma } from "../../../../config/prisma.js";

// ─── Reusable includes ────────────────────────────────────────────────────────

const statusInclude = {
  general_statuses: { select: { name_status: true } },
};

const categoryInclude = {
  include: {
    general_statuses: { select: { name_status: true } },
    _count: { select: { subcategories: true } },
  },
};

const categoryWithSubsInclude = {
  include: {
    general_statuses: { select: { name_status: true } },
    _count:           { select: { subcategories: true } },
    subcategories: {
      include: statusInclude,
      orderBy: { name_subcategory: "asc" },
    },
  },
};

// ─── Category repository ──────────────────────────────────────────────────────

export class CategoryRepository {

  // ── Categories ──────────────────────────────────────────────────────────────

  async findAll() {
    return prisma.categories.findMany({
      ...categoryInclude,
      orderBy: { category_name: "asc" },
    });
  }

  async findById(id) {
    return prisma.categories.findUnique({
      where: { id_category: id },
      ...categoryWithSubsInclude,
    });
  }

  async findByName(name, excludeId = null) {
    return prisma.categories.findFirst({
      where: {
        category_name: { equals: name, mode: "insensitive" },
        ...(excludeId ? { NOT: { id_category: excludeId } } : {}),
      },
    });
  }

  async create(data, initialSubcategories = []) {
    return prisma.$transaction(async (tx) => {
      const category = await tx.categories.create({
        data: {
          category_name:        data.categoryName,
          id_status:            data.idStatus,
          subcategories_count:  initialSubcategories.length,
        },
      });

      if (initialSubcategories.length > 0) {
        await tx.subcategories.createMany({
          data: initialSubcategories.map((sub) => ({
            name_subcategory: sub.name,
            description:      sub.description ?? "",
            id_category:      category.id_category,
            id_status:        sub.idStatus ?? data.idStatus,
          })),
        });
      }

      return tx.categories.findUnique({
        where: { id_category: category.id_category },
        ...categoryWithSubsInclude,
      });
    });
  }

  async update(id, data) {
    const updateData = {};
    if (data.categoryName !== undefined) updateData.category_name = data.categoryName;
    if (data.idStatus     !== undefined) updateData.id_status     = data.idStatus;

    return prisma.categories.update({
      where: { id_category: id },
      data:  updateData,
      ...categoryInclude,
    });
  }

  async deactivateWithSubcategories(id) {
    return prisma.$transaction(async (tx) => {
      await tx.subcategories.updateMany({
        where: { id_category: id },
        data:  { id_status: 2 },
      });
      return tx.categories.update({
        where: { id_category: id },
        data:  { id_status: 2 },
        ...categoryInclude,
      });
    });
  }

  async activateWithSubcategories(id) {
    return prisma.$transaction(async (tx) => {
      await tx.subcategories.updateMany({
        where: { id_category: id },
        data:  { id_status: 1 },
      });
      return tx.categories.update({
        where: { id_category: id },
        data:  { id_status: 1 },
        ...categoryInclude,
      });
    });
  }

  async delete(id) {
    return prisma.$transaction(async (tx) => {
      await tx.subcategories.deleteMany({ where: { id_category: id } });
      return tx.categories.delete({ where: { id_category: id } });
    });
  }

  // ── Subcategories ────────────────────────────────────────────────────────────

  async findSubcategoriesByCategoryId(categoryId) {
    return prisma.subcategories.findMany({
      where:   { id_category: categoryId },
      include: statusInclude,
      orderBy: { name_subcategory: "asc" },
    });
  }

  async findSubcategoryById(id) {
    return prisma.subcategories.findUnique({
      where:   { id_subcategory: id },
      include: statusInclude,
    });
  }

  async findSubcategoryByName(name, categoryId, excludeId = null) {
    return prisma.subcategories.findFirst({
      where: {
        name_subcategory: { equals: name, mode: "insensitive" },
        id_category:      categoryId,
        ...(excludeId ? { NOT: { id_subcategory: excludeId } } : {}),
      },
    });
  }

  async createSubcategory(data) {
    return prisma.$transaction(async (tx) => {
      const sub = await tx.subcategories.create({
        data: {
          name_subcategory: data.name,
          description:      data.description ?? "",
          id_category:      data.idCategory,
          id_status:        data.idStatus,
        },
        include: statusInclude,
      });

      await tx.categories.update({
        where: { id_category: data.idCategory },
        data:  { subcategories_count: { increment: 1 } },
      });

      return sub;
    });
  }

  async findAllSubcategories() {
  return prisma.subcategories.findMany({
    include: statusInclude,
    orderBy: { name_subcategory: "asc" },
  });
}

  async updateSubcategory(id, data) {
    const updateData = {};
    if (data.name        !== undefined) updateData.name_subcategory = data.name;
    if (data.description !== undefined) updateData.description      = data.description;
    if (data.idStatus    !== undefined) updateData.id_status        = data.idStatus;

    return prisma.subcategories.update({
      where:   { id_subcategory: id },
      data:    updateData,
      include: statusInclude,
    });
  }

  async deleteSubcategory(id, categoryId) {
    return prisma.$transaction(async (tx) => {
      await tx.subcategories.delete({ where: { id_subcategory: id } });
      await tx.categories.update({
        where: { id_category: categoryId },
        data:  { subcategories_count: { decrement: 1 } },
      });
    });
  }

  // ── Product checks ───────────────────────────────────────────────────────────

  /**
   * Checks if a subcategory has products associated.
   * In the schema: products.id_categorie → FK to categories.id_category
   * Products are linked directly to categories, not subcategories.
   * This check verifies at the category level.
   */
  async categoryHasProducts(categoryId) {
    const count = await prisma.products.count({
      where: { id_category: categoryId },
    });
    return count > 0; 
  }
}
// ─── Subcategory mapper ───────────────────────────────────────────────────────

/**
 * Maps a Prisma subcategory to the shape the frontend expects.
 *
 * Prisma:   { id_subcategory, name_subcategory, description, id_status, id_category, general_statuses }
 * Response: { id, name, description, status, categoryId }
 */
export const mapSubcategory = (sub) => ({
  id:          sub.id_subcategory,
  name:        sub.name_subcategory,
  description: sub.description ?? "",
  status:      sub.general_statuses?.name_status ?? (sub.id_status === 1 ? "Active" : "Inactive"),
  categoryId:  sub.id_category,
});

// ─── Category mapper ──────────────────────────────────────────────────────────

/**
 * Maps a Prisma category to the shape the frontend expects.
 * `subcategories` is the COUNT (number), not the array.
 *
 * Prisma:   { id_category, category_name, id_status, subcategories_count,
 *             general_statuses, _count }
 * Response: { id, name, status, subcategoriesCount }
 */
export const mapCategory = (cat) => ({
  id:                  cat.id_category,
  name:                cat.category_name,
  status:              cat.general_statuses?.name_status ?? (cat.id_status === 1 ? "Active" : "Inactive"),
  subcategoriesCount:  cat._count?.subcategories ?? cat.subcategories_count ?? 0,
});

/**
 * Category with its full subcategories list.
 * Used in the detail endpoint GET /categories/:id
 */
export const mapCategoryWithSubs = (cat) => ({
  ...mapCategory(cat),
  subcategories: (cat.subcategories ?? []).map(mapSubcategory),
});
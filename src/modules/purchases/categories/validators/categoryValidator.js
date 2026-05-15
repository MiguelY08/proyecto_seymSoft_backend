import { z } from "zod";

// ─── Reusable helpers ─────────────────────────────────────────────────────────

const idSchema = z.coerce
  .number({ invalid_type_error: "The ID must be a number." })
  .int()
  .positive("The ID must be a positive integer.");

const categoryNameSchema = z
  .string({ required_error: "The category name is required." })
  .trim()
  .min(1, "The category name is required.")
  .min(2, "The name must have at least 2 characters.")
  .max(100, "The name cannot exceed 100 characters.")
  .refine((val) => !/^\d/.test(val), {
    message: "The name cannot start with a number.",
  });

const subcategoryNameSchema = z
  .string({ required_error: "The subcategory name is required." })
  .trim()
  .min(1, "The subcategory name is required.")
  .min(2, "The name must have at least 2 characters.")
  .max(100, "The name cannot exceed 100 characters.")
  .refine((val) => !/^\d/.test(val), {
    message: "The subcategory name cannot start with a number.",
  });

const descriptionSchema = z
  .string()
  .trim()
  .max(250, "The description cannot exceed 250 characters.")
  .optional()
  .default("");

const statusSchema = z.coerce
  .number()
  .int()
  .positive("The status must be a positive integer.")
  .optional()
  .default(1);

// ─── Category schemas ─────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  categoryName: categoryNameSchema,
  idStatus:     statusSchema,
  subcategories: z
    .array(
      z.object({
        name:        subcategoryNameSchema,
        description: descriptionSchema,
        idStatus:    statusSchema,
      })
    )
    .optional()
    .default([]),
});

export const updateCategorySchema = z
  .object({
    categoryName: categoryNameSchema.optional(),
    idStatus:     statusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "You must send at least one field to update.",
  });

export const categoryIdSchema = z.object({
  id: idSchema,
});

// ─── Subcategory schemas ──────────────────────────────────────────────────────

export const createSubcategorySchema = z.object({
  name:       subcategoryNameSchema,
  description: descriptionSchema,
  idCategory: z.coerce
    .number({ required_error: "The idCategory is required." })
    .int()
    .positive("The idCategory must be a positive integer."),
  idStatus: statusSchema,
});

export const updateSubcategorySchema = z
  .object({
    name:        subcategoryNameSchema.optional(),
    description: descriptionSchema.optional(),
    idStatus:    statusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "You must send at least one field to update.",
  });

export const subcategoryIdSchema = z.object({
  id: idSchema,
});
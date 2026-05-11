import { z } from "zod";

/**
 * ─────────────────────────────────────────────────────────────
 * 🔧 REUSABLE HELPERS (VALIDADORES REUTILIZABLES)
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Valida un ID:
 * - Convierte el valor a número
 * - Debe ser entero
 * - Debe ser positivo
 */
const idSchema = z.coerce
  .number({ invalid_type_error: "The ID must be a number." })
  .int()
  .positive("The ID must be a positive integer.");

/**
 * Valida el nombre de una categoría:
 * - Obligatorio
 * - Sin espacios al inicio/final
 * - Mínimo 2 caracteres
 * - Máximo 100 caracteres
 * - No puede iniciar con número
 * - Debe tener mínimo 3 caracteres para evitar nombres demasiado cortos como "A" o "B"
 */
const categoryNameSchema = z
  .string({ required_error: "The category name is required." })
  .trim()
  .min(1, "The category name is required.")
  .min(3, "The name must have at least 3 characters.")
  .max(100, "The name cannot exceed 100 characters.")
  .refine((val) => !/^\d/.test(val), {
    message: "The name cannot start with a number.",
  });

  
/**
 * Valida el nombre de una subcategoría:
 * - Misma lógica que categoryName
 * - Debe tener mínimo 3 caracteres para evitar nombres demasiado cortos como "A" o "B"
 */

const subcategoryNameSchema = z
  .string({ required_error: "The subcategory name is required." })
  .trim()
  .min(1, "The subcategory name is required.")
  .min(3, "The name must have at least 3 characters.")
  .max(100, "The name cannot exceed 100 characters.")
  .refine((val) => !/^\d/.test(val), {
    message: "The subcategory name cannot start with a number.",
  });

/**
 * Valida una descripción:
 * - Opcional
 * - Máximo 250 caracteres
 * - Por defecto: string vacío
 */
const descriptionSchema = z
  .string()
  .trim()
  .max(250, "The description cannot exceed 250 characters.")
  .optional()
  .default("");

/**
 * Valida el estado:
 * - Número entero positivo
 * - Opcional
 * - Valor por defecto: 1 (activo)
 */
const statusSchema = z.coerce
  .number()
  .int()
  .positive("The status must be a positive integer.")
  .optional()
  .default(1);

/**
 * ─────────────────────────────────────────────────────────────
 * 📂 CATEGORY SCHEMAS (CATEGORÍAS)
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Schema para crear una categoría
 * Incluye:
 * - Nombre
 * - Estado (opcional)
 * - Subcategorías opcionales
 */
export const createCategorySchema = z.object({
  categoryName: categoryNameSchema,
  idStatus: statusSchema,
  subcategories: z
    .array(
      z.object({
        name: subcategoryNameSchema,
        description: descriptionSchema,
        idStatus: statusSchema,
      })
    )
    .optional()
    .default([]),
});

/**
 * Schema para actualizar una categoría
 * - Todos los campos son opcionales
 * - Pero se exige al menos uno
 */
export const updateCategorySchema = z
  .object({
    categoryName: categoryNameSchema.optional(),
    idStatus: statusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "You must send at least one field to update.",
  });

/**
 * Schema para validar el ID de una categoría
 */
export const categoryIdSchema = z.object({
  id: idSchema,
});

/**
 * ─────────────────────────────────────────────────────────────
 * 📁 SUBCATEGORY SCHEMAS (SUBCATEGORÍAS)
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Schema para crear una subcategoría
 * - Nombre
 * - Descripción
 * - ID de categoría (obligatorio)
 * - Estado
 */
export const createSubcategorySchema = z.object({
  name: subcategoryNameSchema,
  description: descriptionSchema,
  idCategory: z.coerce
    .number({ required_error: "The idCategory is required." })
    .int()
    .positive("The idCategory must be a positive integer."),
  idStatus: statusSchema,
});

/**
 * Schema para actualizar una subcategoría
 * - Todos los campos opcionales
 * - Pero se exige al menos uno
 */
export const updateSubcategorySchema = z
  .object({
    name: subcategoryNameSchema.optional(),
    description: descriptionSchema.optional(),
    idStatus: statusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "You must send at least one field to update.",
  });

/**
 * Schema para validar el ID de una subcategoría
 */
export const subcategoryIdSchema = z.object({
  id: idSchema,
});
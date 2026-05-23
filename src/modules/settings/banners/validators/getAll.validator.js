import { z } from "zod";

/**
 * Validator para obtener todos los banners
 *
 * Responsabilidades:
 * - Validar query params (si existen)
 * - Mantener consistencia arquitectónica
 * - Preparar el endpoint para futuras mejoras
 *
 * Nota:
 * Actualmente este endpoint no requiere parámetros,
 * pero se deja preparado para:
 * - paginación
 * - filtros por estado
 * - búsqueda
 * - ordenamiento dinámico
 *
 * Uso esperado:
 * getAllBannersSchema.parse(req.query);
 */

export const getAllBannersSchema = z
  .object({})
  .strict();
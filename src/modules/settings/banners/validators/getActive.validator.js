import { z } from "zod";

/**
 * Validator para obtener banners activos
 *
 * Responsabilidades:
 * - Validar query params (si existen)
 * - Mantener consistencia arquitectónica
 * - Preparar el endpoint para futuras extensiones
 *
 * Nota:
 * Actualmente este endpoint no requiere parámetros,
 * pero se deja preparado para:
 * - paginación
 * - filtros
 * - búsqueda
 * - ordenamiento dinámico
 *
 * Uso esperado:
 * getActiveBannersSchema.parse(req.query);
 */

export const getActiveBannersSchema = z
  .object({})
  .strict();
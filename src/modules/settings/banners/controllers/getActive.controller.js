import { getActiveBannersSchema } from "../validators/index.js";
import { getActiveBannersUseCase } from "../use-cases/index.js";

/**
 * Controller para obtener banners activos
 *
 * Responsabilidades:
 * - Recibir la petición HTTP
 * - Validar query params
 * - Ejecutar el caso de uso
 * - Retornar una respuesta HTTP consistente
 *
 * Ruta esperada:
 * GET /api/banners/active
 *
 * Nota:
 * Este endpoint alimenta directamente
 * el carrusel público de la tienda.
 */
export const getActiveBannersController = async (req, res, next) => {
  try {
    /**
     * Validar query params.
     * Actualmente no se requieren parámetros,
     * pero se mantiene por consistencia arquitectónica.
     */
    getActiveBannersSchema.parse(req.query);

    /**
     * Ejecutar caso de uso.
     */
    const activeBanners = await getActiveBannersUseCase();

    return res.status(200).json({
      success: true,
      message: "Banners activos obtenidos exitosamente",
      data: activeBanners,
    });
  } catch (error) {
    next(error);
  }
};
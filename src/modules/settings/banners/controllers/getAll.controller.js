import { getAllBannersSchema } from "../validators/index.js";
import { getAllBannersUseCase } from "../use-cases/index.js";

/**
 * Controller para obtener todos los banners
 *
 * Responsabilidades:
 * - Recibir la petición HTTP
 * - Validar query params
 * - Ejecutar el caso de uso
 * - Retornar una respuesta HTTP consistente
 *
 * Ruta esperada:
 * GET /api/banners
 *
 * Nota:
 * Este endpoint alimenta el panel administrativo.
 */
export const getAllBannersController = async (req, res, next) => {
  try {
    /**
     * Validar query params.
     * Actualmente no se requieren parámetros,
     * pero se mantiene por consistencia arquitectónica.
     */
    getAllBannersSchema.parse(req.query);

    const banners = await getAllBannersUseCase();

    return res.status(200).json({
      success: true,
      message: "Banners obtenidos exitosamente",
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};
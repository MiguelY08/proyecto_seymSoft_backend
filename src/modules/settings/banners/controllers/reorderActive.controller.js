import { reorderActiveBannersSchema } from "../validators/index.js";
import { reorderActiveBannersUseCase } from "../use-cases/index.js";

/**
 * Controller para reordenar banners activos
 *
 * Responsabilidades:
 * - Recibir la petición HTTP
 * - Validar el body recibido
 * - Ejecutar el caso de uso
 * - Retornar banners activos actualizados
 *
 * Ruta esperada:
 * PATCH /api/banners/active/reorder
 */
export const reorderActiveBannersController = async (req, res, next) => {
  try {
    /**
     * Validar body.
     * Payload esperado:
     * [
     *   { id: 3, disposition: 1 },
     *   { id: 1, disposition: 2 }
     * ]
     */
    const validatedData = reorderActiveBannersSchema.parse(req.body);

    const reorderedBanners = await reorderActiveBannersUseCase({
      banners: validatedData,
    });

    return res.status(200).json({
      success: true,
      message: "Banners activos reordenados exitosamente",
      data: reorderedBanners,
    });
  } catch (error) {
    next(error);
  }
};
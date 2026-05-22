import { deleteBannerSchema } from "../validators/index.js";
import { deleteBannerUseCase } from "../use-cases/index.js";

/**
 * Controller para eliminar un banner
 *
 * Responsabilidades:
 * - Recibir la petición HTTP
 * - Validar el ID recibido por params
 * - Ejecutar el caso de uso de eliminación
 * - Retornar una respuesta HTTP consistente
 *
 * Ruta esperada:
 * DELETE /api/banners/:id
 *
 * Nota:
 * La regla de negocio:
 * - solo eliminar banners inactivos
 *
 * se valida dentro del use-case.
 */
export const deleteBannerController = async (req, res, next) => {
  try {
    /**
     * Validar params.
     * req.params.id llega como string, pero el schema usa z.coerce.number().
     */
    const validatedData = deleteBannerSchema.parse(req.params);

    /**
     * Ejecutar caso de uso.
     */
    const deletedBanner = await deleteBannerUseCase({
      id: validatedData.id,
    });

    return res.status(200).json({
      success: true,
      message: "Banner eliminado exitosamente",
      data: deletedBanner,
    });
  } catch (error) {
    next(error);
  }
};
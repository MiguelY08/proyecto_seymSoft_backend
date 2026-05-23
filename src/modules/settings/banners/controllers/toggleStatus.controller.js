import { toggleBannerStatusSchema } from "../validators/index.js";
import { toggleBannerStatusUseCase } from "../use-cases/index.js";

/**
 * Controller para activar/desactivar un banner
 *
 * Responsabilidades:
 * - Recibir la petición HTTP
 * - Validar el ID recibido por params
 * - Validar el estado recibido por body
 * - Ejecutar el caso de uso
 * - Retornar una respuesta HTTP consistente
 *
 * Ruta esperada:
 * PATCH /api/banners/:id/status
 */
export const toggleBannerStatusController = async (req, res, next) => {
  try {
    /**
     * Validar params + body.
     */
    const validatedData = toggleBannerStatusSchema.parse({
      id: req.params.id,
      statusId: req.body.statusId,
    });

    const updatedBanner = await toggleBannerStatusUseCase({
      id: validatedData.id,
      statusId: validatedData.statusId,
    });

    return res.status(200).json({
      success: true,
      message: "Estado del banner actualizado exitosamente",
      data: updatedBanner,
    });
  } catch (error) {
    next(error);
  }
};
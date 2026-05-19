import { getBannerByIdSchema } from "../validators/index.js";
import { getBannerByIdUseCase } from "../use-cases/index.js";

/**
 * Controller para obtener un banner por ID
 *
 * Responsabilidades:
 * - Recibir la petición HTTP
 * - Validar el ID recibido por params
 * - Ejecutar el caso de uso
 * - Retornar una respuesta HTTP consistente
 *
 * Ruta esperada:
 * GET /api/banners/:id
 */
export const getBannerByIdController = async (req, res, next) => {
  try {
    /**
     * Validar params.
     * req.params.id llega como string,
     * pero el schema usa z.coerce.number().
     */
    const validatedData = getBannerByIdSchema.parse(req.params);

    const banner = await getBannerByIdUseCase({
      id: validatedData.id,
    });

    return res.status(200).json({
      success: true,
      message: "Banner obtenido exitosamente",
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};
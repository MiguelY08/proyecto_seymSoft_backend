import { createBannerSchema } from "../validators/index.js";
import { createBannerUseCase } from "../use-cases/index.js";

/**
 * Controller para crear un banner
 *
 * Responsabilidades:
 * - Recibir la petición HTTP
 * - Validar el archivo recibido por Multer
 * - Ejecutar el caso de uso de creación
 * - Retornar una respuesta HTTP consistente
 *
 * Ruta esperada:
 * POST /api/banners
 */
export const createBannerController = async (req, res, next) => {
  try {
    /**
     * Validar archivo recibido.
     * Multer debe ejecutarse antes de este controller.
     */
    const validatedData = createBannerSchema.parse({
      file: req.file,
    });

    /**
     * Ejecutar caso de uso.
     */
    const banner = await createBannerUseCase({
      file: validatedData.file,
    });

    return res.status(201).json({
      success: true,
      message: "Banner creado exitosamente",
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};
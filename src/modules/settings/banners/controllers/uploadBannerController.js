import { uploadBannerUseCase } from "../use-cases/index.js";
import { validateUploadBanner, validateBannerFile } from "../validators/uploadBanner.validator.js";

/**
 * UploadBannerController
 * 
 * Responsabilidades:
 * - Validar que existe archivo de imagen
 * - Validar archivo es válido (MIME type, tamaño)
 * - Validar datos del body (idStatus, disposition)
 * - Llamar use-case de carga
 * - Manejar diferentes tipos de error
 * - Retornar banner creado
 * 
 * Validaciones:
 * - Archivo: debe existir, ser imagen, tamaño máximo 10MB
 * - idStatus: debe ser 1 (activo) o 2 (inactivo) - OBLIGATORIO
 * - disposition: número entero positivo - OPCIONAL
 * 
 * Flujo:
 * 1. Validar que existe archivo
 * 2. Validar datos del body (idStatus, disposition)
 * 3. Llamar uploadBannerUseCase con buffer y datos
 * 4. Manejar resultado según errorCode
 * 5. Retornar banner creado
 * 
 * Status codes:
 * - 201: Banner creado exitosamente
 * - 400: Validación falló (archivo o datos)
 * - 409: Disposición ya existe (regla de negocio)
 * - 500: Error en servidor
 * 
 * Nota: El use-case se encarga de:
 * - Procesar imagen (redimensionar, convertir, comprimir)
 * - Generar disposición automática si no se proporciona
 * - Guardar archivo en disco
 * - Crear registro en BD
 * - Rollback si falla BD
 */

/**
 * Carga una nueva imagen de banner
 * 
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.file - Archivo enviado (desde multer middleware)
 * @param {Buffer} req.file.buffer - Buffer de la imagen
 * @param {string} req.file.mimetype - Tipo MIME del archivo
 * @param {number} req.file.size - Tamaño del archivo en bytes
 * @param {Object} req.body - Body de la request
 * @param {number|string} req.body.idStatus - Estado (1=activo, 2=inactivo) - OBLIGATORIO
 * @param {number|string} [req.body.disposition] - Orden en carrusel (opcional)
 * @param {Object} res - Objeto response de Express
 * @returns {void} Retorna respuesta HTTP
 * 
 * @example
 * // Ruta
 * POST /api/admin/banners
 * Content-Type: multipart/form-data
 * 
 * // Body (form-data)
 * file: <imagen.jpg>
 * idStatus: 1
 * disposition: 2
 * 
 * // Éxito con disposición automática
 * Response: 201
 * {
 *   "message": "Banner cargado exitosamente",
 *   "data": {
 *     "idImg": 5,
 *     "imgUrl": "/src/uploads/banner_abc123.webp",
 *     "disposition": 3,
 *     "status": {"id": 1, "name": "Activo"},
 *     "creationDate": "2025-05-14T10:30:00.000Z"
 *   }
 * }
 * 
 * @example
 * // Error: Archivo faltante
 * Response: 400
 * {
 *   "message": "No se proporcionó imagen"
 * }
 * 
 * @example
 * // Error: Validación de datos
 * Response: 400
 * {
 *   "message": "Errores de validación",
 *   "errors": [
 *     {"path": "idStatus", "message": "El estado debe ser 1 (activo) o 2 (inactivo)"}
 *   ]
 * }
 * 
 * @example
 * // Error: Disposición duplicada
 * Response: 409
 * {
 *   "message": "Disposición ya en uso",
 *   "error": "La disposición 2 ya está en uso. Elija otra disposición."
 * }
 * 
 * @example
 * // Error: Procesamiento de imagen
 * Response: 500
 * {
 *   "message": "Error al cargar el banner",
 *   "error": "Error al procesar la imagen: ..."
 * }
 */
export const uploadBannerController = async (req, res) => {
  try {
    console.log(`[uploadBannerController] Iniciando carga de banner`);

    // 1. Validar que existe archivo
    const fileValidation = validateBannerFile(req.file);
    if (!fileValidation.success) {
      console.warn(`[uploadBannerController] Validación de archivo falló:`, fileValidation.error);
      return res.status(400).json({
        message: fileValidation.error,
      });
    }

    // 2. Validar datos del body (idStatus, disposition)
    const dataValidation = validateUploadBanner(req.body);
    if (!dataValidation.success) {
      console.warn(`[uploadBannerController] Validación de datos falló:`, dataValidation.errors);
      return res.status(400).json({
        message: "Errores de validación",
        errors: dataValidation.errors,
      });
    }

    const { idStatus, disposition } = dataValidation.data;

    // 3. Ejecutar use-case con archivo y datos
    console.log(`[uploadBannerController] Llamando uploadBannerUseCase...`);
    const result = await uploadBannerUseCase(req.file.buffer, {
      idStatus,
      disposition,
    });

    // 4. Manejar diferentes tipos de error
    if (!result.success) {
      // Disposición ya existe
      if (result.errorCode === "DUPLICATE_DISPOSITION") {
        console.warn(`[uploadBannerController] Disposición duplicada: ${disposition}`);
        return res.status(409).json({
          message: "Disposición ya en uso",
          error: result.error,
        });
      }

      // Error procesando imagen
      if (result.errorCode === "IMAGE_PROCESSING_ERROR") {
        console.error(`[uploadBannerController] Error procesando imagen:`, result.error);
        return res.status(500).json({
          message: "Error al procesar la imagen",
          error: result.error,
        });
      }

      // Error generando disposición
      if (result.errorCode === "ERROR_GENERATING_DISPOSITION") {
        console.error(`[uploadBannerController] Error generando disposición:`, result.error);
        return res.status(500).json({
          message: "Error al generar disposición automática",
          error: result.error,
        });
      }

      // Error creando en BD
      if (result.errorCode === "ERROR_CREATING_BANNER") {
        console.error(`[uploadBannerController] Error creando banner:`, result.error);
        return res.status(500).json({
          message: "Error al crear el banner",
          error: result.error,
        });
      }

      // Error genérico
      console.error(`[uploadBannerController] Error al cargar:`, result.error);
      return res.status(500).json({
        message: "Error al cargar el banner",
        error: result.error,
      });
    }

    // 5. Éxito: Banner creado
    console.log(`[uploadBannerController] Banner cargado exitosamente: ${result.data.idImg}`);
    return res.status(201).json({
      message: "Banner cargado exitosamente",
      data: result.data,
    });

  } catch (error) {
    console.error(`[uploadBannerController] Error inesperado:`, error);
    return res.status(500).json({
      message: "Error inesperado al cargar el banner",
    });
  }
};
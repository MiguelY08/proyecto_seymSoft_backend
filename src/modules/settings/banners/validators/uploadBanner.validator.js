import { z } from "zod";

/**
 * UploadBannerValidator
 * 
 * Responsabilidades:
 * - Validar datos del body al cargar un banner
 * - Validar estado (idStatus)
 * - Validar disposición/orden (opcional)
 * - Convertir strings a números
 * - Retornar estructura estándar {success, data/errors}
 * 
 * Validación del archivo:
 * - Validación de EXISTENCIA del archivo: multer middleware
 * - Validación de TIPO (MIME): multer fileFilter
 * - Validación de TAMAÑO: multer limits
 * - Validación de CONTENIDO: Sharp (en use-case)
 * 
 * Datos del body:
 * - idStatus: estado del banner (1=activo, 2=inactivo) - OBLIGATORIO
 * - disposition: orden en carrusel (número entero positivo) - OPCIONAL
 * 
 * Flujo de validación:
 * 1. Multer: ¿Existe archivo? ¿Es imagen? ¿Tamaño OK?
 * 2. Este validator: ¿idStatus válido? ¿disposition válido?
 * 3. Use-case: ¿Disposición única? ¿Procesar imagen?
 */

/**
 * Schema Zod para validar datos de carga
 */
const uploadBannerSchema = z.object({
  idStatus: z.coerce
    .number({
      errorMap: () => ({
        message: "El estado debe ser un número",
      }),
    })
    .int({
      message: "El estado debe ser un número entero",
    })
    .refine(
      (val) => [1, 2].includes(val),
      {
        message: "El estado debe ser 1 (activo) o 2 (inactivo)",
      }
    ),

  disposition: z.coerce
    .number({
      errorMap: () => ({
        message: "La disposición debe ser un número",
      }),
    })
    .int({
      message: "La disposición debe ser un número entero",
    })
    .positive({
      message: "La disposición debe ser mayor a 0",
    })
    .optional(),
});

/**
 * Valida datos al cargar un nuevo banner
 * 
 * @param {Object} data - Datos del body (req.body)
 * @param {string|number} data.idStatus - Estado del banner (1=activo, 2=inactivo)
 * @param {string|number} [data.disposition] - Orden en carrusel (opcional)
 * @returns {Object} Resultado de validación
 * @returns {boolean} .success - true si válido, false si hay errores
 * @returns {Object} .data - Datos validados (números convertidos)
 * @returns {Array} .errors - Array de errores si no es válido
 * 
 * @example
 * // Desde controller
 * const validation = validateUploadBanner(req.body);
 * 
 * if (!validation.success) {
 *   return res.status(400).json({
 *     message: "Errores de validación",
 *     errors: validation.errors
 *   });
 * }
 * 
 * // Si el archivo existe (validado por multer)
 * if (!req.file) {
 *   return res.status(400).json({
 *     message: "No se proporcionó imagen"
 *   });
 * }
 * 
 * const { idStatus, disposition } = validation.data;
 * await uploadBannerUseCase(req.file.buffer, {
 *   idStatus,
 *   disposition
 * });
 */
export const validateUploadBanner = (data) => {
  try {
    const validated = uploadBannerSchema.parse(data);

    return {
      success: true,
      data: validated,
    };

  } catch (error) {
    // Zod retorna ZodError con estructura de errores
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."), // "idStatus" o "disposition"
      message: err.message,
    }));

    return {
      success: false,
      errors: formattedErrors,
    };
  }
};

/**
 * FUNCIÓN AUXILIAR: Valida que el archivo exista y sea válido
 * (Este es un paso previo antes de pasar a validateUploadBanner)
 * 
 * @param {Object} file - Objeto file de multer (req.file)
 * @returns {Object} Resultado de validación
 * @returns {boolean} .success - true si archivo es válido
 * @returns {string} .error - Mensaje de error si no es válido
 * 
 * @example
 * const fileValidation = validateBannerFile(req.file);
 * if (!fileValidation.success) {
 *   return res.status(400).json({message: fileValidation.error});
 * }
 */
export const validateBannerFile = (file) => {
  if (!file) {
    return {
      success: false,
      error: "No se proporcionó imagen",
    };
  }

  // Validar MIME type (aunque multer ya lo hace)
  const validMimes = ["image/jpeg", "image/png", "image/webp"];
  if (!validMimes.includes(file.mimetype)) {
    return {
      success: false,
      error: "Tipo de archivo no permitido. Solo JPEG, PNG y WebP",
    };
  }

  // Validar tamaño (10MB máximo)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      success: false,
      error: "El archivo excede el tamaño máximo de 10MB",
    };
  }

  return {
    success: true,
  };
};

/**
 * Alias para compatibilidad (nombres alternativos)
 */
export const validateUploadBannerValidator = validateUploadBanner;
export const validateCreateBanner = validateUploadBanner;
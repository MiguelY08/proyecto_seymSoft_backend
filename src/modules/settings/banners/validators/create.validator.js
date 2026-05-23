import { z } from "zod";

/**
 * Validator para creación de banners
 *
 * Responsabilidades:
 * - Validar presencia de imagen
 * - Validar tipo MIME permitido
 * - Validar existencia del buffer generado por Multer
 *
 * Nota:
 * Las validaciones profundas de imagen
 * (dimensiones, archivo real, procesamiento, etc.)
 * se realizan posteriormente en imageProcessor.js
 */

/**
 * Tipos MIME permitidos
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Tamaño máximo permitido para la imagen.
 * Nota: también puede reforzarse desde multer.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Schema de validación para creación de banner.
 *
 * Payload esperado desde el controller:
 * {
 *   file: req.file
 * }
 */
export const createBannerSchema = z.object({
  file: z
    .object({
      mimetype: z
        .string({
          required_error: "El tipo de archivo es obligatorio",
          invalid_type_error: "El tipo de archivo debe ser texto",
        })
        .refine((type) => ALLOWED_MIME_TYPES.includes(type), {
          message: "Formato de imagen no permitido. Use JPG, JPEG, PNG o WEBP",
        }),

      buffer: z
        .instanceof(Buffer, {
          message: "La imagen no fue cargada correctamente",
        })
        .refine((buffer) => buffer.length > 0, {
          message: "La imagen está vacía",
        }),

      size: z
        .number({
          required_error: "El tamaño de la imagen es obligatorio",
          invalid_type_error: "El tamaño de la imagen debe ser numérico",
        })
        .positive("La imagen está vacía")
        .max(MAX_FILE_SIZE, "La imagen no debe superar los 5MB"),
    })
    .passthrough({
      message: "La imagen es obligatoria",
    }),
});
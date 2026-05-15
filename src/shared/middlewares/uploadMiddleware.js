import multer from "multer";

/**
 * UploadMiddleware
 *
 * Responsabilidades:
 * - Configurar multer para uploads
 * - Limitar tamaño y cantidad de archivos
 * - Filtrar tipos básicos de imagen
 * - Almacenar archivos en memoria
 * - Manejar errores de multer
 *
 * IMPORTANTE:
 * La validación REAL de imagen se hace en imageProcessor.js usando Sharp.
 *
 * Este middleware:
 * - SOLO filtra imágenes básicas por MIME
 * - NO garantiza que el archivo sea una imagen real
 *
 * Sharp:
 * - valida imagen real
 * - valida dimensiones mínimas
 * - procesa imagen
 * - convierte a WebP
 */

/**
 * Configuración
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 1;

/**
 * MIME types permitidos
 *
 * NOTA:
 * Esto NO es validación segura.
 * Sharp hará la validación REAL posteriormente.
 */
const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/**
 * Storage en memoria
 *
 * El archivo:
 * - NO se guarda temporalmente en disco
 * - queda disponible en req.file.buffer
 *
 * Ideal para procesamiento inmediato con Sharp.
 */
const storage = multer.memoryStorage();

/**
 * Filtro básico de archivos
 *
 * Solo permite MIME types de imagen conocidos.
 *
 * @param {Object} req
 * @param {Object} file
 * @param {Function} cb
 */
const fileFilter = (req, file, cb) => {
  console.log(
    `[uploadMiddleware] Validando archivo: ${file.originalname}`
  );

  /**
   * Validación básica MIME
   */
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    console.warn(
      `[uploadMiddleware] MIME rechazado: ${file.mimetype}`
    );

    return cb(
      new Error(
        "Solo se permiten imágenes JPEG, PNG o WebP"
      ),
      false
    );
  }

  console.log(
    `[uploadMiddleware] MIME válido: ${file.mimetype}`
  );

  cb(null, true);
};

/**
 * Configuración principal de multer
 */
const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

/**
 * Manejo centralizado de errores de upload
 *
 * @param {Error} error
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const handleUploadError = (
  error,
  req,
  res,
  next
) => {
  /**
   * Errores propios de multer
   */
  if (error instanceof multer.MulterError) {

    /**
     * Archivo demasiado grande
     */
    if (error.code === "LIMIT_FILE_SIZE") {
      console.warn(
        `[uploadMiddleware] Archivo demasiado grande`
      );

      return res.status(400).json({
        message: "El archivo excede el tamaño máximo permitido (10MB)",
        error: error.message,
      });
    }

    /**
     * Demasiados archivos
     */
    if (error.code === "LIMIT_FILE_COUNT") {
      console.warn(
        `[uploadMiddleware] Demasiados archivos enviados`
      );

      return res.status(400).json({
        message: "Solo se permite 1 archivo por solicitud",
        error: error.message,
      });
    }

    /**
     * Campo inesperado
     */
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      console.warn(
        `[uploadMiddleware] Campo inesperado`
      );

      return res.status(400).json({
        message: "Campo de archivo inválido",
        error: error.message,
      });
    }

    /**
     * Otro error multer
     */
    console.error(
      `[uploadMiddleware] Error de multer:`,
      error.message
    );

    return res.status(400).json({
      message: "Error al procesar archivo",
      error: error.message,
    });
  }

  /**
   * Error personalizado
   */
  if (error) {
    console.error(
      `[uploadMiddleware] Error de validación:`,
      error.message
    );

    return res.status(400).json({
      message: "Archivo inválido",
      error: error.message,
    });
  }

  next();
};

/**
 * Valida que exista archivo
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const validateFileExists = (
  req,
  res,
  next
) => {
  if (!req.file) {
    console.warn(
      `[uploadMiddleware] No se recibió archivo`
    );

    return res.status(400).json({
      message: "No se proporcionó ninguna imagen",
    });
  }

  console.log(
    `[uploadMiddleware] Archivo recibido correctamente`
  );

  console.log(
    `[uploadMiddleware] Nombre: ${req.file.originalname}`
  );

  console.log(
    `[uploadMiddleware] MIME: ${req.file.mimetype}`
  );

  console.log(
    `[uploadMiddleware] Tamaño: ${(req.file.size / 1024).toFixed(2)}KB`
  );

  next();
};

export default upload;
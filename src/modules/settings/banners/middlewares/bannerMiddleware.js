import multer from "multer";

/**
 * Middleware para carga de imágenes del módulo Banner
 *
 * Responsabilidades:
 * - Recibir imágenes desde multipart/form-data
 * - Guardar temporalmente la imagen en memoria
 * - Entregar el archivo como Buffer en req.file
 *
 * Nota:
 * Se usa memoryStorage porque imageProcessor.js trabaja con buffers.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

/**
 * Configuración principal de Multer
 */
export const uploadBannerImage = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
}).single("image");
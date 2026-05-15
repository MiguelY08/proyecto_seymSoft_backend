import sharp from "sharp";
import path from "path";
import fs from "fs";
import crypto from "crypto";

/**
 * ImageProcessor
 *
 * Responsabilidades:
 * - Validar imágenes reales usando Sharp
 * - Validar dimensiones mínimas
 * - Procesar imágenes (resize, compresión, conversión)
 * - Generar nombres únicos
 * - Guardar imágenes en el sistema de archivos
 * - Eliminar imágenes
 * - Garantizar existencia del directorio de uploads
 *
 * Especificaciones:
 * - Dimensiones mínimas requeridas: 1280x720
 * - Dimensiones finales: 1280x720
 * - Formato final: WebP
 * - Calidad WebP: 85
 * - Ajuste: cover + center
 *
 * Flujo:
 * 1. Validar buffer
 * 2. Validar imagen real con Sharp
 * 3. Validar dimensiones mínimas
 * 4. Generar nombre único
 * 5. Redimensionar y convertir a WebP
 * 6. Guardar imagen
 * 7. Retornar URL relativa
 */

/**
 * Obtiene la ruta de uploads desde variables de entorno
 *
 * Prioridad:
 * 1. UPLOADS_BANNERS_DIR
 * 2. UPLOADS_DIR + /banners
 * 3. ./src/uploads/banners
 *
 * @returns {string}
 */
const getUploadDir = () => {
  // Directorio específico para banners
  if (process.env.UPLOADS_BANNERS_DIR) {
    return process.env.UPLOADS_BANNERS_DIR;
  }

  // Directorio genérico de uploads
  if (process.env.UPLOADS_DIR) {
    return path.join(process.env.UPLOADS_DIR, "banners");
  }

  // Default local
  return path.join(process.cwd(), "src/uploads/banners");
};

const uploadDir = getUploadDir();

/**
 * Configuración de procesamiento
 */
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

const WEBP_QUALITY = 85;

console.log(`[imageProcessor] Directorio configurado: ${uploadDir}`);

/**
 * Garantiza que el directorio exista
 *
 * @throws {Error}
 */
const ensureUploadDirectory = () => {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });

      console.log(
        `[imageProcessor] Directorio creado: ${uploadDir}`
      );
    }
  } catch (error) {
    throw new Error(
      `No se puede crear directorio de uploads: ${error.message}`
    );
  }
};

/**
 * Genera nombre único para imagen
 *
 * Formato:
 * banner_[random].webp
 *
 * @returns {string}
 */
const generateUniqueFilename = () => {
  const randomString = crypto.randomBytes(8).toString("hex");

  return `banner_${randomString}.webp`;
};

/**
 * Procesa y guarda imagen
 *
 * @param {Buffer} fileBuffer
 * @returns {Promise<string>}
 *
 * @throws {Error}
 */
export const processAndSaveImage = async (fileBuffer) => {
  try {
    console.log(`[imageProcessor] Iniciando procesamiento de imagen`);

    /**
     * 1. Validar buffer
     */
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Buffer de imagen vacío o inválido");
    }

    console.log(
      `[imageProcessor] Tamaño original: ${(fileBuffer.length / 1024).toFixed(2)}KB`
    );

    /**
     * 2. Validar imagen real con Sharp
     */
    let metadata;

    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch (error) {
      throw new Error(
        "El archivo proporcionado no es una imagen válida"
      );
    }

    /**
     * 3. Validar dimensiones mínimas
     */
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width < MIN_WIDTH ||
      metadata.height < MIN_HEIGHT
    ) {
      throw new Error(
        `La imagen debe tener mínimo ${MIN_WIDTH}x${MIN_HEIGHT}px`
      );
    }

    console.log(
      `[imageProcessor] Dimensiones originales: ${metadata.width}x${metadata.height}`
    );

    /**
     * 4. Garantizar directorio
     */
    ensureUploadDirectory();

    /**
     * 5. Generar nombre único
     */
    const filename = generateUniqueFilename();

    const filePath = path.join(uploadDir, filename);

    console.log(
      `[imageProcessor] Nombre generado: ${filename}`
    );

    /**
     * 6. Procesar imagen
     */
    console.log(
      `[imageProcessor] Procesando imagen (${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}, WebP quality ${WEBP_QUALITY})`
    );

    await sharp(fileBuffer)
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
        fit: "cover",
        position: "center",
        withoutEnlargement: true,
      })
      .webp({
        quality: WEBP_QUALITY,
      })
      .toFile(filePath);

    /**
     * 7. Verificar guardado
     */
    if (!fs.existsSync(filePath)) {
      throw new Error(
        "La imagen no se guardó correctamente"
      );
    }

    const finalFileSize = fs.statSync(filePath).size;

    console.log(
      `[imageProcessor] Tamaño final: ${(finalFileSize / 1024).toFixed(2)}KB`
    );

    /**
     * 8. Retornar URL relativa
     */
    const relativeUrl = `/uploads/banners/${filename}`;

    console.log(
      `[imageProcessor] Procesamiento completado: ${relativeUrl}`
    );

    return relativeUrl;

  } catch (error) {
    console.error(
      `[imageProcessor] Error procesando imagen:`,
      error.message
    );

    throw new Error(
      `Error procesando imagen: ${error.message}`
    );
  }
};

/**
 * Elimina una imagen del sistema de archivos
 *
 * @param {string} imgUrl
 * @returns {Promise<void>}
 */
export const deleteImage = async (imgUrl) => {
  try {
    /**
     * 1. Obtener nombre de archivo
     */
    const filename = path.basename(imgUrl);

    const filePath = path.join(uploadDir, filename);

    console.log(
      `[imageProcessor] Eliminando imagen: ${filename}`
    );

    /**
     * 2. Verificar existencia
     */
    if (!fs.existsSync(filePath)) {
      console.warn(
        `[imageProcessor] Archivo no existe: ${filePath}`
      );

      return;
    }

    /**
     * 3. Eliminar archivo
     */
    fs.unlinkSync(filePath);

    console.log(
      `[imageProcessor] Imagen eliminada: ${filename}`
    );

  } catch (error) {
    console.error(
      `[imageProcessor] Error eliminando imagen:`,
      error.message
    );

    throw new Error(
      `Error eliminando imagen: ${error.message}`
    );
  }
};

/**
 * Obtiene información de una imagen
 *
 * @param {string} imgUrl
 * @returns {Object|null}
 */
const getImageInfo = (imgUrl) => {
  try {
    const filename = path.basename(imgUrl);

    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);

    return {
      filename,
      path: filePath,
      size: stats.size,
      exists: true,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };

  } catch (error) {
    console.error(
      `[imageProcessor] Error obteniendo info:`,
      error.message
    );

    return null;
  }
};

export { getImageInfo };
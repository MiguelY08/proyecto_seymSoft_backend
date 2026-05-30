// src/shared/utils/imageProcessor.js
import sharp from "sharp";
import crypto from "crypto";
import supabase from "../../config/supabaseClient.js";

/**
 * ImageProcessor reutilizable con Supabase Storage
 *
 * Responsabilidades:
 * - Validar imágenes reales usando Sharp
 * - Validar dimensiones mínimas configurables
 * - Procesar imágenes según el caso de uso
 * - Convertir a WebP
 * - Subir buffer al bucket indicado
 * - Obtener URL pública
 * - Eliminar imágenes del bucket indicado
 *
 * Casos de uso posibles:
 * - Banners: 1280x720, fondo desenfocado, relación 16:9
 * - Productos: 800x800, imagen cuadrada, sin fondo desenfocado
 */

const DEFAULT_CONFIG = {
  minWidth: 300,
  minHeight: 300,

  outputWidth: 800,
  outputHeight: 800,

  fit: "contain",
  position: "center",

  webpQuality: 85,

  withBlurBackground: false,
  backgroundBlur: 24,
  backgroundBrightness: 0.75,

  background: {
    r: 255,
    g: 255,
    b: 255,
    alpha: 1,
  },

  prefix: "image",
};

/**
 * Configuración recomendada para banners/carrusel.
 */
export const BANNER_IMAGE_CONFIG = {
  minWidth: 1280,
  minHeight: 720,

  outputWidth: 1280,
  outputHeight: 720,

  fit: "contain",
  position: "center",

  webpQuality: 85,

  withBlurBackground: true,
  backgroundBlur: 24,
  backgroundBrightness: 0.75,

  prefix: "banner",
};

/**
 * Configuración recomendada para productos.
 */
export const PRODUCT_IMAGE_CONFIG = {
  minWidth: 300,
  minHeight: 300,

  outputWidth: 800,
  outputHeight: 800,

  fit: "contain",
  position: "center",

  webpQuality: 85,

  withBlurBackground: false,

  background: {
    r: 255,
    g: 255,
    b: 255,
    alpha: 1,
  },

  prefix: "product",
};

/**
 * Genera nombre único para la imagen.
 *
 * @param {string} prefix
 * @returns {string}
 */
const generateUniqueFilename = (prefix = "image") => {
  const randomString = crypto.randomBytes(8).toString("hex");
  return `${prefix}_${randomString}.webp`;
};

/**
 * Valida que el bucket exista.
 *
 * @param {string} bucketName
 */
const validateBucketName = (bucketName) => {
  if (!bucketName) {
    throw new Error("El nombre del bucket de Supabase es obligatorio");
  }
};

/**
 * Extrae el nombre del archivo desde una URL pública de Supabase.
 *
 * @param {string} imgUrl
 * @returns {string}
 */
const extractFilenameFromUrl = (imgUrl) => {
  try {
    const url = new URL(imgUrl);
    const filename = url.pathname.split("/").pop();

    if (!filename) {
      throw new Error("No se pudo extraer el nombre del archivo de la URL");
    }

    return filename;
  } catch {
    const urlParts = imgUrl.split("/");
    const filename = urlParts[urlParts.length - 1];

    if (!filename) {
      throw new Error("No se pudo extraer el nombre del archivo de la URL");
    }

    return filename;
  }
};

/**
 * Valida que el archivo sea una imagen real y cumpla dimensiones mínimas.
 *
 * @param {Buffer} fileBuffer
 * @param {Object} config
 * @returns {Promise<Object>} metadata de Sharp
 */
const validateImage = async (fileBuffer, config) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("Buffer de imagen vacío o inválido");
  }

  let metadata;

  try {
    metadata = await sharp(fileBuffer).metadata();
  } catch {
    throw new Error("El archivo proporcionado no es una imagen válida");
  }

  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width < config.minWidth ||
    metadata.height < config.minHeight
  ) {
    throw new Error(
      `La imagen debe tener mínimo ${config.minWidth}x${config.minHeight}px`
    );
  }

  return metadata;
};

/**
 * Crea una imagen con fondo desenfocado.
 * Útil para banners cuando se quiere evitar recortes y barras laterales.
 *
 * @param {Buffer} fileBuffer
 * @param {Object} config
 * @returns {Promise<Buffer>}
 */
const createImageWithBlurBackground = async (fileBuffer, config) => {
  const backgroundBuffer = await sharp(fileBuffer)
    .resize(config.outputWidth, config.outputHeight, {
      fit: "cover",
      position: config.position,
    })
    .blur(config.backgroundBlur)
    .modulate({
      brightness: config.backgroundBrightness,
    })
    .toBuffer();

  const foregroundBuffer = await sharp(fileBuffer)
    .resize(config.outputWidth, config.outputHeight, {
      fit: "contain",
      position: config.position,
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    })
    .toBuffer();

  return sharp(backgroundBuffer)
    .composite([
      {
        input: foregroundBuffer,
        gravity: "center",
      },
    ])
    .webp({ quality: config.webpQuality })
    .toBuffer();
};

/**
 * Crea una imagen estándar.
 * Útil para productos, categorías, miniaturas, etc.
 *
 * @param {Buffer} fileBuffer
 * @param {Object} config
 * @returns {Promise<Buffer>}
 */
const createStandardImage = async (fileBuffer, config) => {
  return sharp(fileBuffer)
    .resize(config.outputWidth, config.outputHeight, {
      fit: config.fit,
      position: config.position,
      background: config.background,
    })
    .webp({ quality: config.webpQuality })
    .toBuffer();
};

/**
 * Procesa una imagen según configuración.
 *
 * @param {Buffer} fileBuffer
 * @param {Object} config
 * @returns {Promise<Buffer>}
 */
const createProcessedImageBuffer = async (fileBuffer, config) => {
  if (config.withBlurBackground) {
    return createImageWithBlurBackground(fileBuffer, config);
  }

  return createStandardImage(fileBuffer, config);
};

/**
 * Procesa y sube la imagen a Supabase Storage.
 *
 * @param {Buffer} fileBuffer - Buffer de la imagen original
 * @param {Object} options
 * @param {string} options.bucketName - Bucket destino en Supabase
 * @param {Object} [options.config] - Configuración de procesamiento
 * @returns {Promise<string>} URL pública de la imagen subida
 */
export const processAndSaveImage = async (
  fileBuffer,
  { bucketName, config = {} } = {}
) => {
  try {
    validateBucketName(bucketName);

    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    console.log("[imageProcessor] Iniciando procesamiento de imagen");

    console.log(
      `[imageProcessor] Tamaño original: ${(fileBuffer.length / 1024).toFixed(2)}KB`
    );

    const metadata = await validateImage(fileBuffer, finalConfig);

    console.log(
      `[imageProcessor] Dimensiones originales: ${metadata.width}x${metadata.height}`
    );

    const filename = generateUniqueFilename(finalConfig.prefix);

    console.log(`[imageProcessor] Bucket destino: ${bucketName}`);
    console.log(`[imageProcessor] Nombre generado: ${filename}`);
    console.log(
      `[imageProcessor] Procesando imagen (${finalConfig.outputWidth}x${finalConfig.outputHeight}, WebP quality ${finalConfig.webpQuality})`
    );

    const processedBuffer = await createProcessedImageBuffer(
      fileBuffer,
      finalConfig
    );

    console.log(
      `[imageProcessor] Tamaño después de procesar: ${(processedBuffer.length / 1024).toFixed(2)}KB`
    );

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filename, processedBuffer, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error subiendo imagen a Supabase: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    console.log(`[imageProcessor] Imagen subida exitosamente: ${filename}`);
    console.log(`[imageProcessor] URL pública generada: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("[imageProcessor] Error procesando imagen:", error.message);
    throw new Error(`Error procesando imagen: ${error.message}`);
  }
};

/**
 * Elimina una imagen del bucket de Supabase.
 *
 * @param {string} imgUrl - URL pública de la imagen
 * @param {Object} options
 * @param {string} options.bucketName - Bucket donde está almacenada la imagen
 * @returns {Promise<void>}
 */
export const deleteImage = async (imgUrl, { bucketName } = {}) => {
  try {
    validateBucketName(bucketName);

    const filename = extractFilenameFromUrl(imgUrl);

    console.log(`[imageProcessor] Bucket origen: ${bucketName}`);
    console.log(`[imageProcessor] Eliminando imagen del bucket: ${filename}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filename]);

    if (error) {
      throw new Error(`Error eliminando imagen de Supabase: ${error.message}`);
    }

    console.log(`[imageProcessor] Imagen eliminada exitosamente: ${filename}`);
  } catch (error) {
    console.error("[imageProcessor] Error eliminando imagen:", error.message);
    throw new Error(`Error eliminando imagen: ${error.message}`);
  }
};

/**
 * Obtiene información básica de una imagen.
 *
 * @param {string} imgUrl - URL pública de la imagen
 * @returns {Object|null}
 */
export const getImageInfo = async (imgUrl) => {
  try {
    const filename = extractFilenameFromUrl(imgUrl);

    return {
      filename,
      url: imgUrl,
      exists: true,
      source: "supabase",
    };
  } catch (error) {
    console.error("[imageProcessor] Error obteniendo info:", error.message);
    return null;
  }
};
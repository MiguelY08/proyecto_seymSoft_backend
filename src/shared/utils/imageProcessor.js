// src/shared/utils/imageProcessor.js
import sharp from "sharp";
import crypto from "crypto";
import supabase from "../../config/supabaseClient.js";

/**
 * ImageProcessor con Supabase Storage
 *
 * Responsabilidades:
 * - Validar imágenes reales usando Sharp
 * - Validar dimensiones mínimas
 * - Procesar imágenes 16:9
 * - Crear fondo desenfocado para evitar barras blancas/laterales
 * - Subir buffer al bucket indicado de Supabase Storage
 * - Obtener URL pública
 * - Eliminar imágenes del bucket indicado
 */

const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

const WEBP_QUALITY = 85;
const BACKGROUND_BLUR = 24;
const BACKGROUND_BRIGHTNESS = 0.75;

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
 * Crea una imagen 16:9 con fondo desenfocado.
 *
 * @param {Buffer} fileBuffer
 * @returns {Promise<Buffer>}
 */
const createImageBuffer = async (fileBuffer) => {
  const backgroundBuffer = await sharp(fileBuffer)
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
      fit: "cover",
      position: "center",
    })
    .blur(BACKGROUND_BLUR)
    .modulate({
      brightness: BACKGROUND_BRIGHTNESS,
    })
    .toBuffer();

  const foregroundBuffer = await sharp(fileBuffer)
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
      fit: "contain",
      position: "center",
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
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
};

/**
 * Procesa y sube la imagen a Supabase Storage.
 *
 * @param {Buffer} fileBuffer - Buffer de la imagen original
 * @param {Object} options
 * @param {string} options.bucketName - Bucket destino en Supabase
 * @param {string} [options.prefix="image"] - Prefijo del archivo generado
 * @returns {Promise<string>} URL pública de la imagen subida
 */
export const processAndSaveImage = async (
  fileBuffer,
  { bucketName, prefix = "image" } = {}
) => {
  try {
    validateBucketName(bucketName);

    console.log("[imageProcessor] Iniciando procesamiento de imagen");

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Buffer de imagen vacío o inválido");
    }

    console.log(
      `[imageProcessor] Tamaño original: ${(fileBuffer.length / 1024).toFixed(2)}KB`
    );

    let metadata;

    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch {
      throw new Error("El archivo proporcionado no es una imagen válida");
    }

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

    const filename = generateUniqueFilename(prefix);

    console.log(`[imageProcessor] Bucket destino: ${bucketName}`);
    console.log(`[imageProcessor] Nombre generado: ${filename}`);

    const processedBuffer = await createImageBuffer(fileBuffer);

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
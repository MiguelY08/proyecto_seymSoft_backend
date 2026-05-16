// src/services/imageProcessor.js
import sharp from "sharp";
import crypto from "crypto";
import supabase from "../../config/supabaseClient.js";

/**
 * ImageProcessor con Supabase Storage
 *
 * Responsabilidades:
 * - Validar imágenes reales usando Sharp
 * - Validar dimensiones mínimas
 * - Procesar imágenes (resize, compresión, conversión)
 * - Subir buffer a Supabase Storage
 * - Obtener URL pública
 * - Eliminar imágenes del bucket
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
 * 5. Redimensionar y convertir a WebP → toBuffer()
 * 6. Subir buffer a Supabase Storage
 * 7. Obtener URL pública
 * 8. Retornar URL pública
 */

const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;
const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;
const WEBP_QUALITY = 85;

// Bucket de Supabase (definido en .env)
const BUCKET_NAME = process.env.SUPABASE_BUCKET;

if (!BUCKET_NAME) {
  throw new Error("Missing SUPABASE_BUCKET environment variable");
}

/**
 * Genera nombre único para la imagen en el bucket
 * Formato: banner_[random].webp
 * @returns {string}
 */
const generateUniqueFilename = () => {
  const randomString = crypto.randomBytes(8).toString("hex");
  return `banner_${randomString}.webp`;
};

/**
 * Procesa y sube la imagen a Supabase Storage
 * @param {Buffer} fileBuffer - Buffer de la imagen original
 * @returns {Promise<string>} URL pública de la imagen subida
 * @throws {Error}
 */
export const processAndSaveImage = async (fileBuffer) => {
  try {
    console.log(`[imageProcessor] Iniciando procesamiento de imagen`);

    // 1. Validar buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Buffer de imagen vacío o inválido");
    }

    console.log(
      `[imageProcessor] Tamaño original: ${(fileBuffer.length / 1024).toFixed(2)}KB`
    );

    // 2. Validar imagen real con Sharp
    let metadata;
    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch (error) {
      throw new Error("El archivo proporcionado no es una imagen válida");
    }

    // 3. Validar dimensiones mínimas
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

    // 4. Generar nombre único
    const filename = generateUniqueFilename();
    console.log(`[imageProcessor] Nombre generado: ${filename}`);

    // 5. Procesar imagen (redimensionar + convertir a WebP) y obtener buffer
    console.log(
      `[imageProcessor] Procesando imagen (${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}, WebP quality ${WEBP_QUALITY})`
    );

    const processedBuffer = await sharp(fileBuffer)
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
        fit: "cover",
        position: "center",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer(); // ⬅️ Cambiamos toFile() por toBuffer()

    console.log(
      `[imageProcessor] Tamaño después de procesar: ${(processedBuffer.length / 1024).toFixed(2)}KB`
    );

    // 6. Subir buffer a Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, processedBuffer, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error subiendo imagen a Supabase: ${uploadError.message}`);
    }

    console.log(`[imageProcessor] Imagen subida exitosamente: ${filename}`);

    // 7. Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    console.log(`[imageProcessor] URL pública generada: ${publicUrl}`);

    // 8. Retornar URL pública (se guardará en la BD)
    return publicUrl;

  } catch (error) {
    console.error(`[imageProcessor] Error procesando imagen:`, error.message);
    throw new Error(`Error procesando imagen: ${error.message}`);
  }
};

/**
 * Elimina una imagen del bucket de Supabase
 * @param {string} imgUrl - URL pública de la imagen (o ruta dentro del bucket)
 * @returns {Promise<void>}
 */
export const deleteImage = async (imgUrl) => {
  try {
    // Extraer el nombre del archivo (último segmento de la URL)
    // Ejemplo: https://xxx.supabase.co/storage/v1/object/public/banners/banner_abc123.webp
    const urlParts = imgUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    if (!filename) {
      throw new Error("No se pudo extraer el nombre del archivo de la URL");
    }

    console.log(`[imageProcessor] Eliminando imagen del bucket: ${filename}`);

    // Eliminar del bucket de Supabase
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (error) {
      throw new Error(`Error eliminando imagen de Supabase: ${error.message}`);
    }

    console.log(`[imageProcessor] Imagen eliminada exitosamente: ${filename}`);

  } catch (error) {
    console.error(`[imageProcessor] Error eliminando imagen:`, error.message);
    throw new Error(`Error eliminando imagen: ${error.message}`);
  }
};

/**
 * Obtiene información de una imagen (opcional - adaptado para Supabase)
 * Nota: Como ahora trabajamos con URLs públicas, esta función puede no ser necesaria.
 * Se mantiene por compatibilidad, pero solo retorna información básica desde la URL.
 * @param {string} imgUrl - URL pública de la imagen
 * @returns {Object|null}
 */
export const getImageInfo = async (imgUrl) => {
  try {
    const urlParts = imgUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Podríamos consultar metadata desde Supabase si es necesario, pero por ahora
    // retornamos información mínima.
    return {
      filename,
      url: imgUrl,
      exists: true, // Asumimos que existe (la validación real requeriría head() del storage)
      source: "supabase",
    };
  } catch (error) {
    console.error(`[imageProcessor] Error obteniendo info:`, error.message);
    return null;
  }
};
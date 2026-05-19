import { bannerRepository } from "../repositories/bannerRepository.js";
import {
  processAndSaveImage,
  deleteImage,
} from "../../../../shared/utils/imageProcessor.js";

/**
 * Caso de uso: Crear banner
 *
 * Responsabilidades:
 * - Recibir el archivo validado desde el controller
 * - Procesar y subir la imagen a Supabase Storage
 * - Crear el registro en BD
 * - Crear el banner como ACTIVO por defecto
 * - Asignar automáticamente la última disposition + 1
 * - Eliminar la imagen subida si falla el registro en BD
 *
 * @param {Object} params
 * @param {Object} params.file - Archivo recibido por Multer
 * @returns {Promise<Object>}
 */
export const createBannerUseCase = async ({ file }) => {
  if (!file) {
    throw new Error("La imagen es obligatoria");
  }

  let imageUrl = null;

  try {
    /**
     * 1. Procesar imagen y subirla a Supabase.
     * imageProcessor retorna la URL pública.
     */
    imageUrl = await processAndSaveImage(file.buffer);

    /**
     * 2. Obtener la última disposición usada entre banners activos.
     */
    const lastDisposition = await bannerRepository.getLastActiveDisposition();

    /**
     * 3. La nueva imagen se agrega al final del carrusel.
     */
    const newDisposition = lastDisposition + 1;

    /**
     * 4. Crear registro en BD.
     * El repository se encarga de crearla activa por defecto.
     */
    const banner = await bannerRepository.create({
      imgUrl: imageUrl,
      disposition: newDisposition,
    });

    return banner;
  } catch (error) {
    /**
     * Si la imagen fue subida correctamente,
     * pero falló el registro en BD,
     * eliminamos la imagen para evitar archivos huérfanos.
     */
    if (imageUrl) {
      await deleteImage(imageUrl);
    }

    throw error;
  }
};
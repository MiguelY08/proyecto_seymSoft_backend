import { bannerRepository } from "../repositories/bannerRepository.js";
import { deleteImage } from "../../../../shared/utils/imageProcessor.js";

/**
 * Caso de uso: Eliminar banner
 *
 * Responsabilidades:
 * - Verificar que el banner exista
 * - Verificar que esté INACTIVO antes de eliminar
 * - Eliminar imagen del bucket de Supabase
 * - Eliminar registro de la base de datos
 *
 * Regla de negocio:
 * - Una imagen solo puede eliminarse si está inactiva.
 *
 * @param {Object} params
 * @param {number} params.id - ID del banner
 * @returns {Promise<Object>}
 */
export const deleteBannerUseCase = async ({ id }) => {
  /**
   * 1. Buscar banner por ID
   */
  const banner = await bannerRepository.findById(id);

  if (!banner) {
    throw new Error("El banner no existe");
  }

  /**
   * 2. Validar que esté inactivo
   */
  if (banner.status.id !== 2) {
    throw new Error("Solo se pueden eliminar banners inactivos");
  }

  /**
   * 3. Eliminar imagen del bucket de Supabase
   */
  await deleteImage(banner.imageUrl, {
    bucketName: process.env.SUPABASE_BUCKET_BANNERS,
  });

  /**
   * 4. Eliminar registro en base de datos
   */
  const deletedBanner = await bannerRepository.delete(id);

  return deletedBanner;
};
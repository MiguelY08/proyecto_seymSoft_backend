import { bannerRepository } from "../repositories/bannerRepository.js";

/**
 * Caso de uso: Obtener banners activos
 *
 * Responsabilidades:
 * - Obtener únicamente banners activos
 * - Retornar banners ordenados por disposition ASC
 * - Alimentar el carrusel público de la tienda
 *
 * Nota:
 * El orden visual del carrusel depende directamente
 * del campo disposition.
 *
 * @returns {Promise<Array>}
 */
export const getActiveBannersUseCase = async () => {
  /**
   * Obtener banners activos desde repository
   */
  const activeBanners = await bannerRepository.findAllActive();

  return activeBanners;
};
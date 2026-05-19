import { bannerRepository } from "../repositories/bannerRepository.js";

/**
 * Caso de uso: Obtener todos los banners
 *
 * Responsabilidades:
 * - Obtener banners activos e inactivos
 * - Retornar información completa para el panel administrativo
 *
 * Nota:
 * Este endpoint alimenta la gestión administrativa,
 * no el carrusel público.
 *
 * @returns {Promise<Array>}
 */
export const getAllBannersUseCase = async () => {
  /**
   * Obtener todos los banners desde repository
   */
  const banners = await bannerRepository.findAll();

  return banners;
};
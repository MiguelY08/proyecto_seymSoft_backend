import { bannerRepository } from "../repositories/bannerRepository.js";

/**
 * Caso de uso: Obtener banner por ID
 *
 * Responsabilidades:
 * - Buscar un banner específico
 * - Verificar existencia
 * - Retornar información del banner
 *
 * Nota:
 * Este endpoint puede ser utilizado
 * tanto por el panel administrativo
 * como por futuras funcionalidades.
 *
 * @param {Object} params
 * @param {number} params.id - ID del banner
 * @returns {Promise<Object>}
 */
export const getBannerByIdUseCase = async ({ id }) => {
  /**
   * Buscar banner
   */
  const banner = await bannerRepository.findById(id);

  /**
   * Validar existencia
   */
  if (!banner) {
    throw new Error("El banner no existe");
  }

  return banner;
};
import { prisma } from "../../../../config/prisma.js";
import { bannerRepository } from "../repositories/bannerRepository.js";

/**
 * Caso de uso: Reordenar banners activos
 *
 * Responsabilidades:
 * - Validar existencia de banners
 * - Validar que todos estén activos
 * - Validar que se estén enviando todos los banners activos
 * - Normalizar dispositions para que sean secuenciales
 * - Actualizar dispositions de forma transaccional
 *
 * Payload esperado:
 * [
 *   { id: 3, disposition: 1 },
 *   { id: 1, disposition: 2 },
 *   { id: 2, disposition: 3 }
 * ]
 *
 * Nota:
 * Solo se pueden reordenar banners ACTIVOS.
 *
 * @param {Object} params
 * @param {Array} params.banners
 * @returns {Promise<Array>}
 */
export const reorderActiveBannersUseCase = async ({ banners }) => {
  /**
   * 1. Obtener banners activos actuales.
   */
  const activeBanners = await bannerRepository.findAllActive();

  /**
   * 2. Validar que se estén enviando todos los banners activos.
   * Esto evita que el carrusel quede parcialmente ordenado.
   */
  if (banners.length !== activeBanners.length) {
    throw new Error("Debe enviar todos los banners activos para reordenar");
  }

  /**
   * 3. Obtener IDs enviados y IDs activos reales.
   */
  const bannerIds = banners.map((banner) => banner.id);
  const activeBannerIds = activeBanners.map((banner) => banner.id);

  /**
   * 4. Validar que todos los IDs enviados existan dentro de los activos.
   */
  const hasInvalidBanner = bannerIds.some(
    (id) => !activeBannerIds.includes(id)
  );

  if (hasInvalidBanner) {
    throw new Error("Solo se pueden reordenar banners activos existentes");
  }

  /**
   * 5. Normalizar dispositions.
   * Aunque el frontend envíe disposition,
   * aquí garantizamos que queden 1, 2, 3...
   * según el orden recibido en el array.
   */
  const normalizedBanners = banners.map((banner, index) => ({
    id: banner.id,
    disposition: index + 1,
  }));

  /**
   * 6. Actualizar dispositions en dos fases.
   *
   * Como disposition es @unique en Prisma,
   * no podemos intercambiar valores directamente:
   *
   * Ejemplo:
   * id 1 -> 1
   * id 2 -> 2
   *
   * Si queremos:
   * id 1 -> 2
   * id 2 -> 1
   *
   * Prisma/PostgreSQL puede lanzar error por duplicado.
   *
   * Por eso:
   * - Primero movemos temporalmente todas las dispositions a valores negativos.
   * - Luego asignamos las nuevas posiciones definitivas.
   */
  await prisma.$transaction(async (tx) => {
    for (const banner of normalizedBanners) {
      await tx.banner_img.update({
        where: {
          id_img: banner.id,
        },
        data: {
          disposition: -banner.id,
        },
      });
    }

    for (const banner of normalizedBanners) {
      await tx.banner_img.update({
        where: {
          id_img: banner.id,
        },
        data: {
          disposition: banner.disposition,
        },
      });
    }
  });

  /**
   * 7. Retornar banners activos actualizados
   * ya ordenados correctamente.
   */
  const updatedBanners = await bannerRepository.findAllActive();

  return updatedBanners;
};
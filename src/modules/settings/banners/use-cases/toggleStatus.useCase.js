import { prisma } from "../../../../config/prisma.js";
import { bannerRepository } from "../repositories/bannerRepository.js";

/**
 * Caso de uso: Activar / Desactivar banner
 */
export const toggleBannerStatusUseCase = async ({ id, statusId }) => {
  const banner = await bannerRepository.findById(id);

  if (!banner) {
    throw new Error("El banner no existe");
  }

  if (banner.status.id === statusId) {
    throw new Error("El banner ya tiene este estado");
  }

  /**
   * Desactivar banner
   */
  if (statusId === 2) {
    await prisma.$transaction(async (tx) => {
      /**
       * 1. Desactivar banner seleccionado
       */
      await tx.banner_img.update({
        where: {
          id_img: id,
        },
        data: {
          id_status: 2,
          disposition: null,
        },
      });

      /**
       * 2. Obtener banners activos restantes
       */
      const activeBanners = await tx.banner_img.findMany({
        where: {
          id_status: 1,
          disposition: {
            not: null,
          },
        },
        orderBy: {
          disposition: "asc",
        },
      });

      /**
       * 3. Mover temporalmente a valores negativos
       * para evitar choque con @unique.
       */
      for (const activeBanner of activeBanners) {
        await tx.banner_img.update({
          where: {
            id_img: activeBanner.id_img,
          },
          data: {
            disposition: -activeBanner.id_img,
          },
        });
      }

      /**
       * 4. Reasignar posiciones finales 1, 2, 3...
       */
      for (const [index, activeBanner] of activeBanners.entries()) {
        await tx.banner_img.update({
          where: {
            id_img: activeBanner.id_img,
          },
          data: {
            disposition: index + 1,
          },
        });
      }
    });

    return await bannerRepository.findById(id);
  }

  /**
   * Activar banner
   */
  const lastDisposition = await bannerRepository.getLastActiveDisposition();

  return await bannerRepository.updateStatus(id, {
    statusId: 1,
    disposition: lastDisposition + 1,
  });
};
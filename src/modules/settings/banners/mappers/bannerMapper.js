import { GENERAL_STATUSES } from "../../../../shared/constants/generalStatuses.js";

/**
 * Mapper del módulo Banner
 *
 * Responsabilidades:
 * - Transformar datos provenientes de Prisma/BD
 * - Convertir propiedades snake_case → camelCase
 * - Estandarizar respuestas hacia controllers/front
 * - Evitar exponer estructura interna de la BD
 */

/**
 * Mapea un banner individual
 *
 * Entrada (Prisma):
 * {
 *   id_img,
 *   img_url,
 *   id_status,
 *   disposition
 * }
 *
 * Salida:
 * {
 *   id,
 *   imageUrl,
 *   status,
 *   disposition
 * }
 *
 * @param {Object} banner
 * @returns {Object|null}
 */
export const toBannerResponse = (banner) => {
  if (!banner) return null;

  return {
    id: banner.id_img,

    imageUrl: banner.img_url,

    status: {
      id: banner.id_status,
      name: GENERAL_STATUSES[banner.id_status]?.name || "Desconocido",
    },

    /**
     * Solo aplica para banners activos.
     * Si el banner está inactivo,
     * disposition puede ser null.
     */
    disposition: banner.disposition,
  };
};

/**
 * Mapea múltiples banners
 *
 * @param {Array} banners
 * @returns {Array}
 */
export const toBannerListResponse = (banners = []) => {
  return banners.map(toBannerResponse);
};
import { prisma } from "../../../../config/prisma.js";
import {
  toBannerResponse,
  toBannerListResponse,
} from "../mappers/bannerMapper.js";

/**
 * Repository del módulo Banner
 *
 * Responsabilidad:
 * - Comunicarse directamente con Prisma
 * - Consultar, crear, actualizar y eliminar registros en BD
 * - No contiene lógica de negocio compleja
 */

export const bannerRepository = {
  /**
   * Obtiene todos los banners, activos e inactivos.
   *
   * @returns {Promise<Array>}
   */
  async findAll() {
    const banners = await prisma.banner_img.findMany({
      orderBy: [
        { id_status: "asc" },
        { disposition: "asc" },
        { id_img: "asc" },
      ],
    });

    return toBannerListResponse(banners);
  },

  /**
   * Obtiene únicamente los banners activos.
   * Se ordenan por disposition para mostrarlos correctamente en el carrusel.
   *
   * @returns {Promise<Array>}
   */
  async findAllActive() {
    const banners = await prisma.banner_img.findMany({
      where: {
        id_status: 1,
      },
      orderBy: {
        disposition: "asc",
      },
    });

    return toBannerListResponse(banners);
  },

  /**
   * Busca un banner por su ID.
   *
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const banner = await prisma.banner_img.findUnique({
      where: {
        id_img: id,
      },
    });

    return toBannerResponse(banner);
  },

  /**
   * Crea un nuevo banner.
   * Por defecto se crea activo.
   *
   * @param {Object} data
   * @param {string} data.imgUrl
   * @param {number} data.disposition
   * @returns {Promise<Object>}
   */
  async create({ imgUrl, disposition }) {
    const banner = await prisma.banner_img.create({
      data: {
        img_url: imgUrl,
        id_status: 1,
        disposition,
      },
    });

    return toBannerResponse(banner);
  },

  /**
   * Actualiza el estado de un banner.
   *
   * Si se desactiva:
   * - id_status = 2
   * - disposition = null
   *
   * Si se activa:
   * - id_status = 1
   * - disposition debe enviarse desde el caso de uso
   *
   * @param {number} id
   * @param {Object} data
   * @param {number} data.statusId
   * @param {number|null} data.disposition
   * @returns {Promise<Object>}
   */
  async updateStatus(id, { statusId, disposition }) {
    const banner = await prisma.banner_img.update({
      where: {
        id_img: id,
      },
      data: {
        id_status: statusId,
        disposition,
      },
    });

    return toBannerResponse(banner);
  },

  /**
   * Actualiza la disposición de un banner activo.
   *
   * @param {number} id
   * @param {number} disposition
   * @returns {Promise<Object>}
   */
  async updateDisposition(id, disposition) {
    const banner = await prisma.banner_img.update({
      where: {
        id_img: id,
      },
      data: {
        disposition,
      },
    });

    return toBannerResponse(banner);
  },

  /**
   * Elimina un banner de la base de datos.
   * La imagen en Supabase debe eliminarse desde el caso de uso.
   *
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const banner = await prisma.banner_img.delete({
      where: {
        id_img: id,
      },
    });

    return toBannerResponse(banner);
  },

  /**
   * Obtiene la última disposición usada entre banners activos.
   *
   * @returns {Promise<number>}
   */
  async getLastActiveDisposition() {
    const lastBanner = await prisma.banner_img.findFirst({
      where: {
        id_status: 1,
        disposition: {
          not: null,
        },
      },
      orderBy: {
        disposition: "desc",
      },
    });

    return lastBanner?.disposition || 0;
  },
};
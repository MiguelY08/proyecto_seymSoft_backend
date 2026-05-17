import { prisma } from "../../../../config/prisma.js";
import { BannerMapper } from "../mappers/bannerMapper.js";

/**
 * BannerRepository
 * 
 * Responsabilidades:
 * - Gestionar acceso exclusivo a BD para banners
 * - Crear banners con disposición automática
 * - Reorganizar banners automáticamente
 * - Gestionar activación/desactivación
 * - Garantizar integridad de disposiciones
 * - Transformar respuestas mediante BannerMapper
 * 
 * Arquitectura actual:
 * - Los banners nuevos nacen ACTIVOS
 * - La disposición se genera automáticamente
 * - Los banners inactivos tienen disposition = null
 * - No pueden existir huecos entre disposiciones activas
 * - El frontend NO controla disposition inicial
 * 
 * Métodos principales:
 * - create()
 * - findById()
 * - findAll()
 * - findActive()
 * - updateStatus()
 * - updateDisposition()
 * - delete()
 * 
 * Helpers privados:
 * - #getNextDisposition()
 * - #reorderDispositionsAfterDelete()
 * - #shiftDispositionsForReorder()
 * - #existsByImgUrl()
 */

export class BannerRepository {

  /**
   * Crea un nuevo banner
   * 
   * Comportamiento:
   * - Siempre nace ACTIVO
   * - Obtiene disposición automática
   * - Inserta al final del carrusel
   * 
   * @param {Object} bannerData
   * @param {string} bannerData.imgUrl
   * 
   * @returns {Promise<Object>}
   */
  async create(bannerData) {
    try {

      // Validar URL única
      if (await this.#existsByImgUrl(bannerData.imgUrl)) {
        throw new Error("DUPLICATE_IMG_URL");
      }

      // Obtener siguiente disposición automática
      const nextDisposition = await this.#getNextDisposition();

      // Transformar para BD
      const dataForDB = BannerMapper.toPersistence({
        imgUrl: bannerData.imgUrl,
        idStatus: 1, // Activo automático
        disposition: nextDisposition,
      });

      // Crear banner
      const banner = await prisma.banner_img.create({
        data: dataForDB,
      });

      return BannerMapper.toResponse(banner);

    } catch (error) {

      if (error.message === "DUPLICATE_IMG_URL") {
        throw new Error("DUPLICATE_IMG_URL");
      }

      if (error.code === "P2002") {
        throw new Error("UNIQUE_CONSTRAINT_FAILED");
      }

      throw new Error(`ERROR_CREATING_BANNER: ${error.message}`);
    }
  }

  /**
   * Obtener banner por ID
   * 
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    try {

      const banner = await prisma.banner_img.findUnique({
        where: {
          id_img: id,
        },
      });

      if (!banner) {
        return null;
      }

      return BannerMapper.toResponse(banner);

    } catch (error) {
      throw new Error(`ERROR_FINDING_BANNER_BY_ID: ${error.message}`);
    }
  }

  /**
   * Obtener todos los banners
   * 
   * Orden:
   * - Activos primero
   * - Inactivos después
   * 
   * @returns {Promise<Array>}
   */
  async findAll() {
    try {

      const banners = await prisma.banner_img.findMany({
        orderBy: [
          {
            id_status: "asc",
          },
          {
            disposition: "asc",
          },
        ],
      });

      return BannerMapper.toResponseArray(
        banners,
        "response"
      );

    } catch (error) {
      throw new Error(`ERROR_FINDING_ALL_BANNERS: ${error.message}`);
    }
  }

  /**
   * Obtener banners activos
   * 
   * Utilizado por:
   * - Landing
   * - Tienda virtual
   * - Carrusel frontend
   * 
   * @returns {Promise<Array>}
   */
  async findActive() {
    try {

      const banners = await prisma.banner_img.findMany({
        where: {
          id_status: 1,
        },

        orderBy: {
          disposition: "asc",
        },
      });

      return BannerMapper.toResponseArray(
        banners,
        "public"
      );

    } catch (error) {
      throw new Error(`ERROR_FINDING_ACTIVE_BANNERS: ${error.message}`);
    }
  }

  /**
   * Actualizar estado de banner
   * 
   * Reglas:
   * 
   * ACTIVAR:
   * - Obtiene siguiente disposición
   * - Entra al final del carrusel
   * 
   * DESACTIVAR:
   * - Libera disposición
   * - Reorganiza banners restantes
   * 
   * @param {number} id
   * @param {number} idStatus
   * 
   * @returns {Promise<Object>}
   */
  async updateStatus(id, idStatus) {
    try {

      const existingBanner =
        await prisma.banner_img.findUnique({
          where: {
            id_img: id,
          },
        });

      if (!existingBanner) {
        throw new Error("BANNER_NOT_FOUND");
      }

      let disposition = existingBanner.disposition;

      /**
       * ACTIVAR BANNER
       */
      if (
        idStatus === 1 &&
        existingBanner.id_status === 2
      ) {
        disposition = await this.#getNextDisposition();
      }

      /**
       * DESACTIVAR BANNER
       */
      if (
        idStatus === 2 &&
        existingBanner.id_status === 1
      ) {

        const oldDisposition =
          existingBanner.disposition;

        disposition = null;

        await this.#reorderDispositionsAfterDelete(
          oldDisposition
        );
      }

      // Actualizar
      const updatedBanner =
        await prisma.banner_img.update({
          where: {
            id_img: id,
          },

          data: {
            id_status: idStatus,
            disposition,
          },
        });

      return BannerMapper.toResponse(updatedBanner);

    } catch (error) {

      if (error.message === "BANNER_NOT_FOUND") {
        throw new Error("BANNER_NOT_FOUND");
      }

      throw new Error(
        `ERROR_UPDATING_BANNER_STATUS: ${error.message}`
      );
    }
  }

  /**
   * Reorganizar disposición de banner
   * 
   * Ejemplo:
   * 5 → posición 2
   * 
   * El resto de banners se reorganizan automáticamente
   * 
   * @param {number} id
   * @param {number} newDisposition
   * 
   * @returns {Promise<Object>}
   */
  async updateDisposition(id, newDisposition) {
    try {

      const banner =
        await prisma.banner_img.findUnique({
          where: {
            id_img: id,
          },
        });

      if (!banner) {
        throw new Error("BANNER_NOT_FOUND");
      }

      if (banner.id_status !== 1) {
        throw new Error("INACTIVE_BANNER");
      }

      const oldDisposition =
        banner.disposition;

      // No hacer nada si es igual
      if (oldDisposition === newDisposition) {
        return BannerMapper.toResponse(banner);
      }

      // Reorganizar posiciones
      await this.#shiftDispositionsForReorder(
        oldDisposition,
        newDisposition
      );

      // Actualizar banner
      const updatedBanner =
        await prisma.banner_img.update({
          where: {
            id_img: id,
          },

          data: {
            disposition: newDisposition,
          },
        });

      return BannerMapper.toResponse(updatedBanner);

    } catch (error) {

      if (error.message === "BANNER_NOT_FOUND") {
        throw new Error("BANNER_NOT_FOUND");
      }

      if (error.message === "INACTIVE_BANNER") {
        throw new Error("INACTIVE_BANNER");
      }

      throw new Error(
        `ERROR_UPDATING_DISPOSITION: ${error.message}`
      );
    }
  }

  /**
   * Eliminar banner
   * 
   * Reglas:
   * - Si estaba activo:
   *   reorganizar disposiciones
   * 
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {

      const banner =
        await prisma.banner_img.findUnique({
          where: {
            id_img: id,
          },
        });

      if (!banner) {
        throw new Error("BANNER_NOT_FOUND");
      }

      // Si estaba activo
      if (
        banner.id_status === 1 &&
        banner.disposition
      ) {
        await this.#reorderDispositionsAfterDelete(
          banner.disposition
        );
      }

      // Eliminar
      await prisma.banner_img.delete({
        where: {
          id_img: id,
        },
      });

      return BannerMapper.toResponse(banner);

    } catch (error) {

      if (error.message === "BANNER_NOT_FOUND") {
        throw new Error("BANNER_NOT_FOUND");
      }

      throw new Error(
        `ERROR_DELETING_BANNER: ${error.message}`
      );
    }
  }

  /**
   * Obtener siguiente disposición disponible
   * 
   * Ejemplo:
   * 1,2,3 → retorna 4
   * 
   * @private
   * @returns {Promise<number>}
   */
  async #getNextDisposition() {

    const lastBanner =
      await prisma.banner_img.findFirst({
        where: {
          id_status: 1,
        },

        orderBy: {
          disposition: "desc",
        },
      });

    if (!lastBanner) {
      return 1;
    }

    return lastBanner.disposition + 1;
  }

  /**
   * Reorganiza disposiciones
   * después de eliminar/desactivar
   * 
   * Ejemplo:
   * 1,2,4,5 → 1,2,3,4
   * 
   * @private
   * @param {number} deletedDisposition
   */
  async #reorderDispositionsAfterDelete(
    deletedDisposition
  ) {

    const banners =
      await prisma.banner_img.findMany({
        where: {
          id_status: 1,
          disposition: {
            gt: deletedDisposition,
          },
        },
      });

    for (const banner of banners) {

      await prisma.banner_img.update({
        where: {
          id_img: banner.id_img,
        },

        data: {
          disposition: banner.disposition - 1,
        },
      });
    }
  }

  /**
   * Desplaza banners durante reorganización
   * 
   * Ejemplo:
   * mover 5 → 2
   * 
   * @private
   * @param {number} oldDisposition
   * @param {number} newDisposition
   */
  async #shiftDispositionsForReorder(
    oldDisposition,
    newDisposition
  ) {

    /**
     * SUBIR EN EL CARRUSEL
     * 5 → 2
     */
    if (newDisposition < oldDisposition) {

      const affectedBanners =
        await prisma.banner_img.findMany({
          where: {
            id_status: 1,

            disposition: {
              gte: newDisposition,
              lt: oldDisposition,
            },
          },
        });

      for (const banner of affectedBanners) {

        await prisma.banner_img.update({
          where: {
            id_img: banner.id_img,
          },

          data: {
            disposition: banner.disposition + 1,
          },
        });
      }
    }

    /**
     * BAJAR EN EL CARRUSEL
     * 2 → 5
     */
    if (newDisposition > oldDisposition) {

      const affectedBanners =
        await prisma.banner_img.findMany({
          where: {
            id_status: 1,

            disposition: {
              gt: oldDisposition,
              lte: newDisposition,
            },
          },
        });

      for (const banner of affectedBanners) {

        await prisma.banner_img.update({
          where: {
            id_img: banner.id_img,
          },

          data: {
            disposition: banner.disposition - 1,
          },
        });
      }
    }
  }

  /**
   * Validar URL única
   * 
   * @private
   * @param {string} imgUrl
   * @returns {Promise<boolean>}
   */
  async #existsByImgUrl(imgUrl) {

    const banner =
      await prisma.banner_img.findUnique({
        where: {
          img_url: imgUrl,
        },
      });

    return !!banner;
  }
}
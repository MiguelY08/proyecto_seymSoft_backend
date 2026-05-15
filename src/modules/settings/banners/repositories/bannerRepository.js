import { prisma } from "../../../../config/prisma.js";
import { BannerMapper } from "../mappers/bannerMapper.js";

/**
 * BannerRepository
 * 
 * Responsabilidades:
 * - Acceso exclusivo a datos de banners en BD
 * - Ejecutar operaciones CRUD con Prisma
 * - Manejar errores de BD (duplicados, no encontrado, etc)
 * - Transformar datos con BannerMapper
 * - Garantizar integridad de datos
 * 
 * Métodos públicos:
 * - create(): Crear nuevo banner
 * - findById(): Obtener banner por ID
 * - findAll(): Obtener todos los banners
 * - findActive(): Obtener banners activos (tienda)
 * - update(): Actualizar banner
 * - delete(): Eliminar banner
 * 
 * Métodos privados (validación):
 * - #existsByDisposition(): Validar disposición única
 * - #existsByImgUrl(): Validar URL única
 * 
 * Nota: Solo el repository lanza excepciones detalladas
 * Los use-cases las capturan y convierten en errorCode
 */

export class BannerRepository {
  /**
   * Crea un nuevo banner en la BD
   * 
   * @param {Object} bannerData - Datos del banner en camelCase
   * @param {string} bannerData.imgUrl - URL de la imagen
   * @param {number} bannerData.idStatus - ID del estado
   * @param {number} bannerData.disposition - Orden del carrusel
   * @returns {Promise<Object>} Banner creado (camelCase)
   * @throws {Error} Si fallan validaciones o BD
   * 
   * @example
   * await bannerRepository.create({
   *   imgUrl: "/uploads/banner.webp",
   *   idStatus: 1,
   *   disposition: 1
   * })
   */
  async create(bannerData) {
    try {
      // Validar que URL no exista
      if (await this.#existsByImgUrl(bannerData.imgUrl)) {
        throw new Error("DUPLICATE_IMG_URL");
      }

      // Validar que disposición no exista
      if (await this.#existsByDisposition(bannerData.disposition)) {
        throw new Error("DUPLICATE_DISPOSITION");
      }

      // Transformar a snake_case y crear
      const dataForDB = BannerMapper.toPersistence(bannerData);

      const banner = await prisma.banner_img.create({
        data: dataForDB,
      });

      // Transformar respuesta a camelCase
      return BannerMapper.toResponse(banner);

    } catch (error) {
      if (error.message === "DUPLICATE_IMG_URL") {
        throw new Error("DUPLICATE_IMG_URL");
      }

      if (error.message === "DUPLICATE_DISPOSITION") {
        throw new Error("DUPLICATE_DISPOSITION");
      }

      // Error de BD (Prisma)
      if (error.code === "P2002") {
        throw new Error("UNIQUE_CONSTRAINT_FAILED");
      }

      throw new Error(`ERROR_CREATING_BANNER: ${error.message}`);
    }
  }

  /**
   * Obtiene un banner por su ID
   * 
   * @param {number} id - ID del banner (id_img)
   * @returns {Promise<Object|null>} Banner en camelCase o null si no existe
   * @throws {Error} Si hay error en BD
   * 
   * @example
   * const banner = await bannerRepository.findById(1);
   */
  async findById(id) {
    try {
      const banner = await prisma.banner_img.findUnique({
        where: { id_img: id },
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
   * Obtiene todos los banners (para panel administrativo)
   * Ordenados por disposición
   * 
   * @returns {Promise<Array>} Array de banners en camelCase
   * @throws {Error} Si hay error en BD
   * 
   * @example
   * const banners = await bannerRepository.findAll();
   */
  async findAll() {
    try {
      const banners = await prisma.banner_img.findMany({
        orderBy: { disposition: "asc" },
      });

      return BannerMapper.toResponseArray(banners, "response");

    } catch (error) {
      throw new Error(`ERROR_FINDING_ALL_BANNERS: ${error.message}`);
    }
  }

  /**
   * Obtiene solo banners activos (para tienda/landing)
   * Respuesta simplificada (público)
   * 
   * @returns {Promise<Array>} Array de banners activos (datos públicos)
   * @throws {Error} Si hay error en BD
   * 
   * @example
   * const activeBanners = await bannerRepository.findActive();
   */
  async findActive() {
    try {
      const banners = await prisma.banner_img.findMany({
        where: {
          id_status: 1, // 1 = Activo
        },
        orderBy: { disposition: "asc" },
      });

      return BannerMapper.toResponseArray(banners, "public");

    } catch (error) {
      throw new Error(`ERROR_FINDING_ACTIVE_BANNERS: ${error.message}`);
    }
  }

  /**
   * Actualiza datos de un banner
   * 
   * @param {number} id - ID del banner (id_img)
   * @param {Object} updateData - Campos a actualizar (camelCase)
   * @param {number} [updateData.idStatus] - Nuevo estado
   * @param {number} [updateData.disposition] - Nuevo orden
   * @returns {Promise<Object>} Banner actualizado (camelCase)
   * @throws {Error} Si banner no existe o hay validación fallida
   * 
   * @example
   * await bannerRepository.update(1, {
   *   idStatus: 2,
   *   disposition: 2
   * })
   */
  async update(id, updateData) {
    try {
      // Validar que banner existe
      const existingBanner = await prisma.banner_img.findUnique({
        where: { id_img: id },
      });

      if (!existingBanner) {
        throw new Error("BANNER_NOT_FOUND");
      }

      // Si cambia disposición, validar unicidad (excepto la propia)
      if (updateData.disposition && updateData.disposition !== existingBanner.disposition) {
        const dispositionExists = await prisma.banner_img.findUnique({
          where: { disposition: updateData.disposition },
        });

        if (dispositionExists) {
          throw new Error("DUPLICATE_DISPOSITION");
        }
      }

      // Transformar a snake_case
      const dataForDB = {};
      if (updateData.idStatus !== undefined) {
        dataForDB.id_status = updateData.idStatus;
      }
      if (updateData.disposition !== undefined) {
        dataForDB.disposition = updateData.disposition;
      }

      const updatedBanner = await prisma.banner_img.update({
        where: { id_img: id },
        data: dataForDB,
      });

      return BannerMapper.toResponse(updatedBanner);

    } catch (error) {
      if (error.message === "BANNER_NOT_FOUND") {
        throw new Error("BANNER_NOT_FOUND");
      }

      if (error.message === "DUPLICATE_DISPOSITION") {
        throw new Error("DUPLICATE_DISPOSITION");
      }

      throw new Error(`ERROR_UPDATING_BANNER: ${error.message}`);
    }
  }

  /**
   * Elimina un banner de la BD
   * También elimina el archivo físico (responsibility del use-case)
   * 
   * @param {number} id - ID del banner a eliminar
   * @returns {Promise<Object>} Banner eliminado (camelCase)
   * @throws {Error} Si banner no existe
   * 
   * @example
   * const deleted = await bannerRepository.delete(1);
   */
  async delete(id) {
    try {
      // Obtener banner antes de eliminar (para retornar datos)
      const banner = await prisma.banner_img.findUnique({
        where: { id_img: id },
      });

      if (!banner) {
        throw new Error("BANNER_NOT_FOUND");
      }

      // Eliminar de BD
      await prisma.banner_img.delete({
        where: { id_img: id },
      });

      // Retornar datos del eliminado
      return BannerMapper.toResponse(banner);

    } catch (error) {
      if (error.message === "BANNER_NOT_FOUND") {
        throw new Error("BANNER_NOT_FOUND");
      }

      throw new Error(`ERROR_DELETING_BANNER: ${error.message}`);
    }
  }

  /**
   * MÉTODO PRIVADO: Verifica si una disposición ya existe
   * 
   * @private
   * @param {number} disposition - Disposición a validar
   * @returns {Promise<boolean>} true si existe, false si no
   */
  async #existsByDisposition(disposition) {
    const banner = await prisma.banner_img.findUnique({
      where: { disposition },
    });

    return !!banner;
  }

  /**
   * MÉTODO PRIVADO: Verifica si una URL de imagen ya existe
   * 
   * @private
   * @param {string} imgUrl - URL a validar
   * @returns {Promise<boolean>} true si existe, false si no
   */
  async #existsByImgUrl(imgUrl) {
    const banner = await prisma.banner_img.findUnique({
      where: { img_url: imgUrl },
    });

    return !!banner;
  }
}
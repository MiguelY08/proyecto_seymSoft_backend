import { GENERAL_STATUSES } from "../../../../shared/constants/generalStatuses.js";

/**
 * BannerMapper
 * 
 * Responsabilidades:
 * - Transformar datos de BD (snake_case) a formato interno (camelCase)
 * - Transformar datos internos al formato de respuesta API
 * - Mapear id_status a objeto status legible
 * - Generar respuestas públicas simplificadas
 * 
 * Métodos:
 * - toPersistence(): camelCase → snake_case (para Prisma/BD)
 * - toResponse(): BD → respuesta administrativa
 * - toPublicResponse(): BD → respuesta pública
 * - toResponseArray(): Transformar arrays de banners
 * 
 * Arquitectura actual:
 * - id_status se gestiona automáticamente desde backend
 * - disposition se gestiona automáticamente desde backend
 * - disposition puede ser null en banners inactivos
 * - No existe creation_date en el nuevo modelo
 * 
 * Flujo:
 * Frontend → camelCase → toPersistence → BD
 * BD → snake_case → toResponse → API
 */

export class BannerMapper {

  /**
   * Transforma datos internos (camelCase)
   * al formato de persistencia (snake_case)
   * 
   * Uso principal:
   * - Crear banners
   * - Actualizar estado
   * - Actualizar disposición
   * 
   * @param {Object} bannerData - Datos internos
   * @param {string} [bannerData.imgUrl] - URL pública de la imagen
   * @param {number} [bannerData.idStatus] - Estado del banner
   * @param {number|null} [bannerData.disposition] - Orden del banner
   * 
   * @returns {Object} Datos listos para BD
   * 
   * @example
   * BannerMapper.toPersistence({
   *   imgUrl: "https://xxx.supabase.co/storage/v1/object/public/banners/banner.webp",
   *   idStatus: 1,
   *   disposition: 2
   * });
   * 
   * // Retorna:
   * // {
   * //   img_url: "...",
   * //   id_status: 1,
   * //   disposition: 2
   * // }
   */
  static toPersistence(bannerData) {
    return {
      img_url: bannerData.imgUrl,
      id_status: bannerData.idStatus,
      disposition: bannerData.disposition,
    };
  }

  /**
   * Transforma datos de BD (snake_case)
   * a respuesta administrativa (camelCase)
   * 
   * Incluye:
   * - Estado legible
   * - Información completa del banner
   * 
   * Usado en:
   * - GET admin
   * - POST response
   * - PATCH response
   * - DELETE response
   * 
   * @param {Object} bannerFromDB - Registro desde BD
   * @param {number} bannerFromDB.id_img - ID del banner
   * @param {string} bannerFromDB.img_url - URL pública imagen
   * @param {number} bannerFromDB.id_status - Estado
   * @param {number|null} bannerFromDB.disposition - Orden
   * 
   * @returns {Object} Banner transformado
   * 
   * @example
   * BannerMapper.toResponse({
   *   id_img: 1,
   *   img_url: "https://...",
   *   id_status: 1,
   *   disposition: 3
   * });
   * 
   * // Retorna:
   * // {
   * //   idImg: 1,
   * //   imgUrl: "...",
   * //   disposition: 3,
   * //   status: {
   * //     id: 1,
   * //     name: "Activo"
   * //   }
   * // }
   */
  static toResponse(bannerFromDB) {
    return {
      idImg: bannerFromDB.id_img,

      imgUrl: bannerFromDB.img_url,

      disposition: bannerFromDB.disposition,

      status: {
        id: bannerFromDB.id_status,
        name:
          GENERAL_STATUSES[bannerFromDB.id_status]?.name ||
          "Desconocido",
      },
    };
  }

  /**
   * Transforma datos para respuesta pública
   * 
   * Esta respuesta es utilizada por:
   * - Landing page
   * - Tienda virtual
   * - Carrusel frontend
   * 
   * Solo expone:
   * - id
   * - imagen
   * - disposición
   * 
   * No expone:
   * - estado
   * - metadata administrativa
   * 
   * @param {Object} bannerFromDB - Registro desde BD
   * 
   * @returns {Object} Banner público simplificado
   * 
   * @example
   * BannerMapper.toPublicResponse({
   *   id_img: 1,
   *   img_url: "https://...",
   *   disposition: 1
   * });
   * 
   * // Retorna:
   * // {
   * //   idImg: 1,
   * //   imgUrl: "...",
   * //   disposition: 1
   * // }
   */
  static toPublicResponse(bannerFromDB) {
    return {
      idImg: bannerFromDB.id_img,

      imgUrl: bannerFromDB.img_url,

      disposition: bannerFromDB.disposition,
    };
  }

  /**
   * Transforma arrays completos de banners
   * 
   * Tipos soportados:
   * - response → respuesta administrativa
   * - public → respuesta pública
   * 
   * @param {Array<Object>} banners - Lista de banners
   * @param {"response"|"public"} [responseType="response"]
   * 
   * @returns {Array<Object>} Array transformado
   * 
   * @example
   * BannerMapper.toResponseArray(banners);
   * 
   * @example
   * BannerMapper.toResponseArray(banners, "public");
   */
  static toResponseArray(
    banners,
    responseType = "response"
  ) {
    const mapper =
      responseType === "public"
        ? this.toPublicResponse
        : this.toResponse;

    return banners.map((banner) =>
      mapper.call(this, banner)
    );
  }
}
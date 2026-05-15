import { GENERAL_STATUSES } from "../../../../shared/constants/generalStatuses.js";

/**
 * BannerMapper
 * 
 * Responsabilidades:
 * - Transformar datos de BD (snake_case) a formato interno (camelCase)
 * - Transformar datos internos a formato de respuesta API
 * - Mapear id_status a objeto status completo
 * - Limpiar datos sensibles para respuestas públicas
 * 
 * Métodos:
 * - toPersistence(): Convierte camelCase → snake_case (para guardar en BD)
 * - toResponse(): Convierte BD → camelCase (respuesta completa para admin)
 * - toPublicResponse(): Convierte BD → respuesta pública (solo lo necesario)
 * 
 * Flujo de transformación:
 * BD (snake_case) → toPersistence/toResponse → API (camelCase)
 */

export class BannerMapper {
  /**
   * Transforma datos de entrada (camelCase) al formato de BD (snake_case)
   * 
   * @param {Object} bannerData - Datos en camelCase
   * @param {string} [bannerData.imgUrl] - URL de la imagen
   * @param {number} [bannerData.idStatus] - ID del estado
   * @param {number} [bannerData.disposition] - Orden de disposición
   * @returns {Object} Datos transformados a snake_case
   * 
   * @example
   * BannerMapper.toPersistence({
   *   imgUrl: "/uploads/banner.webp",
   *   idStatus: 1,
   *   disposition: 1
   * })
   * // Retorna: { img_url: "...", id_status: 1, disposition: 1 }
   */
  static toPersistence(bannerData) {
    return {
      img_url: bannerData.imgUrl,
      id_status: bannerData.idStatus,
      disposition: bannerData.disposition,
      creation_date: bannerData.creationDate,
    };
  }

  /**
   * Transforma datos de BD (snake_case) a formato interno (camelCase)
   * Incluye información completa del estado
   * 
   * @param {Object} bannerFromDB - Datos de la BD con snake_case
   * @param {number} bannerFromDB.id_img - ID de la imagen
   * @param {string} bannerFromDB.img_url - URL de la imagen
   * @param {number} bannerFromDB.id_status - ID del estado
   * @param {number} bannerFromDB.disposition - Orden
   * @param {string} bannerFromDB.creation_date - Fecha de creación
   * @param {Object} [bannerFromDB.general_statuses] - Relación con estados
   * @returns {Object} Banner en camelCase con status mapeado
   * 
   * @example
   * BannerMapper.toResponse({
   *   id_img: 1,
   *   img_url: "/uploads/banner.webp",
   *   id_status: 1,
   *   disposition: 1,
   *   creation_date: "2025-05-13T10:30:00"
   * })
   * // Retorna: { idImg: 1, imgUrl: "...", status: {id: 1, name: "Activo"}, ... }
   */
  static toResponse(bannerFromDB) {
    return {
      idImg: bannerFromDB.id_img,
      imgUrl: bannerFromDB.img_url,
      disposition: bannerFromDB.disposition,
      status: {
        id: bannerFromDB.id_status,
        name: GENERAL_STATUSES[bannerFromDB.id_status]?.name || "Desconocido",
      },
      creationDate: bannerFromDB.creation_date,
    };
  }

  /**
   * Transforma datos para respuesta pública (tienda/landing)
   * Solo incluye información necesaria para mostrar el carrusel
   * Oculta metadata administrativa
   * 
   * @param {Object} bannerFromDB - Datos de la BD
   * @returns {Object} Banner simplificado para público
   * 
   * @example
   * BannerMapper.toPublicResponse({
   *   id_img: 1,
   *   img_url: "/uploads/banner.webp",
   *   disposition: 1
   * })
   * // Retorna: { idImg: 1, imgUrl: "...", disposition: 1 }
   */
  static toPublicResponse(bannerFromDB) {
    return {
      idImg: bannerFromDB.id_img,
      imgUrl: bannerFromDB.img_url,
      disposition: bannerFromDB.disposition,
    };
  }

  /**
   * Transforma un array de banners
   * 
   * @param {Array} banners - Array de banners de BD
   * @param {string} [responseType="response"] - Tipo de respuesta: "response" o "public"
   * @returns {Array} Array de banners transformados
   */
  static toResponseArray(banners, responseType = "response") {
    const mapper = responseType === "public" 
      ? this.toPublicResponse 
      : this.toResponse;

    return banners.map((banner) => mapper.call(this, banner));
  }
}
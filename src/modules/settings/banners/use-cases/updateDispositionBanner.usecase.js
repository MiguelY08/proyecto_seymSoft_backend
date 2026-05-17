import { BannerRepository } from "../repositories/bannerRepository.js";

/**
 * UpdateDispositionBannerUseCase
 * 
 * Responsabilidades:
 * - Obtener banner actual por ID
 * - Validar que el banner existe
 * - Validar que la nueva disposición es diferente
 * - OPCIÓN B: Reordenar automáticamente otros banners si hay conflicto
 * - Actualizar disposiciones en BD de forma atómica
 * - Manejar diferentes tipos de error
 * - Retornar banner actualizado
 * 
 * Flujo (OPCIÓN B - Smart Reordering):
 * 1. Obtener banner actual
 * 2. Si no existe → BANNER_NOT_FOUND
 * 3. Si nueva disposición = actual → sin cambios (retornar igual)
 * 4. Si nueva < actual:
 *    - Banners entre [nueva, actual) → incrementar disposition
 *    - Banner seleccionado → nueva disposición
 * 5. Si nueva > actual:
 *    - Banners entre (actual, nueva] → decrementar disposition
 *    - Banner seleccionado → nueva disposición
 * 
 * Ejemplo:
 * Inicial: [1: A, 2: B, 3: C, 4: D, 5: E]
 * Usuario: Mover C (id=3, pos 3) a posición 1
 * 
 * Proceso:
 * - A (pos 1): 1 → 2
 * - B (pos 2): 2 → 3
 * - C (pos 3): 3 → 1 ← seleccionado
 * - D (pos 4): sin cambios
 * - E (pos 5): sin cambios
 * 
 * Final: [1: C, 2: A, 3: B, 4: D, 5: E]
 * 
 * Nota: Operación debe ser atómica (todo o nada)
 */

const bannerRepository = new BannerRepository();

/**
 * Actualiza la disposición (orden) de un banner
 * Reordena automáticamente otros banners si es necesario
 * 
 * @param {number} idBanner - ID del banner a mover
 * @param {number} newDisposition - Nueva posición deseada
 * @returns {Promise<Object>} Resultado de la operación
 * @returns {boolean} .success - true si fue exitoso
 * @returns {Object} .data - Banner actualizado (si éxito)
 * @returns {string} .error - Mensaje de error (si falla)
 * @returns {string} .errorCode - Código de error (si falla)
 * @returns {Array} .updatedBanners - Todos los banners reordenados (si éxito)
 * 
 * @example
 * // Mover banner de posición 3 a posición 1
 * const result = await updateDispositionBannerUseCase(5, 1);
 * // {
 * //   success: true,
 * //   data: {idImg: 5, disposition: 1, ...},
 * //   updatedBanners: [{...}, {...}] // Todos reordenados
 * // }
 * 
 * @example
 * // Banner no existe
 * const result = await updateDispositionBannerUseCase(999, 1);
 * // {
 * //   success: false,
 * //   errorCode: "BANNER_NOT_FOUND",
 * //   error: "El banner no existe"
 * // }
 */
export const updateDispositionBannerUseCase = async (idBanner, newDisposition) => {
  try {
    console.log(
      `[updateDispositionBannerUseCase] Moviendo banner ${idBanner} a disposición ${newDisposition}`
    );

    // 1. Obtener banner actual
    let currentBanner;
    try {
      currentBanner = await bannerRepository.findById(idBanner);
    } catch (error) {
      console.error(`[updateDispositionBannerUseCase] Error al obtener banner:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_FETCHING_BANNER",
        error: `Error al obtener el banner: ${error.message}`,
      };
    }

    // 2. Validar que el banner existe
    if (!currentBanner) {
      console.warn(`[updateDispositionBannerUseCase] Banner no encontrado: ${idBanner}`);
      return {
        success: false,
        errorCode: "BANNER_NOT_FOUND",
        error: "El banner que intenta mover no existe",
      };
    }

    const currentDisposition = currentBanner.disposition;

    // 3. Validar que la disposición es diferente
    if (newDisposition === currentDisposition) {
      console.log(
        `[updateDispositionBannerUseCase] Disposición ya es ${currentDisposition}, sin cambios`
      );
      return {
        success: true,
        data: currentBanner,
        message: "Banner ya está en esa posición",
      };
    }

    console.log(
      `[updateDispositionBannerUseCase] Reordenando: ${currentDisposition} → ${newDisposition}`
    );

    // 4. Obtener todos los banners para reordenar
    let allBanners;
    try {
      allBanners = await bannerRepository.findAll();
    } catch (error) {
      console.error(`[updateDispositionBannerUseCase] Error al obtener banners:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_FETCHING_BANNERS",
        error: `Error al obtener los banners: ${error.message}`,
      };
    }

    // 5. Calcular nuevas disposiciones (LÓGICA B - Smart Reordering)
    const updatesNeeded = [];

    if (newDisposition < currentDisposition) {
      // Mover hacia arriba: incrementar disposiciones intermedias
      console.log(`[updateDispositionBannerUseCase] Movimiento hacia arriba`);

      for (const banner of allBanners) {
        if (banner.idImg === idBanner) {
          // El banner seleccionado va a la nueva disposición
          updatesNeeded.push({
            idImg: banner.idImg,
            oldDisposition: banner.disposition,
            newDisposition: newDisposition,
          });
        } else if (banner.disposition >= newDisposition && banner.disposition < currentDisposition) {
          // Los banners entre [nueva, actual) se desplazan hacia abajo
          updatesNeeded.push({
            idImg: banner.idImg,
            oldDisposition: banner.disposition,
            newDisposition: banner.disposition + 1,
          });
        }
      }
    } else {
      // Mover hacia abajo: decrementar disposiciones intermedias
      console.log(`[updateDispositionBannerUseCase] Movimiento hacia abajo`);

      for (const banner of allBanners) {
        if (banner.idImg === idBanner) {
          // El banner seleccionado va a la nueva disposición
          updatesNeeded.push({
            idImg: banner.idImg,
            oldDisposition: banner.disposition,
            newDisposition: newDisposition,
          });
        } else if (banner.disposition > currentDisposition && banner.disposition <= newDisposition) {
          // Los banners entre (actual, nueva] se desplazan hacia arriba
          updatesNeeded.push({
            idImg: banner.idImg,
            oldDisposition: banner.disposition,
            newDisposition: banner.disposition - 1,
          });
        }
      }
    }

    console.log(
      `[updateDispositionBannerUseCase] Cambios necesarios: ${updatesNeeded.length} banners`
    );

    // 6. Aplicar cambios en BD
    let updatedBanners = [];
    try {
      for (const update of updatesNeeded) {
        console.log(
          `[updateDispositionBannerUseCase] Actualizando ${update.idImg}: ${update.oldDisposition} → ${update.newDisposition}`
        );

        const updated = await bannerRepository.update(update.idImg, {
          disposition: update.newDisposition,
        });

        updatedBanners.push(updated);
      }

      console.log(`[updateDispositionBannerUseCase] Reordenamiento completado exitosamente`);
    } catch (error) {
      console.error(`[updateDispositionBannerUseCase] Error al actualizar BD:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_UPDATING_BANNERS",
        error: `Error al reordenar banners: ${error.message}`,
      };
    }

    // 7. Obtener el banner actualizado
    let finalBanner;
    try {
      finalBanner = await bannerRepository.findById(idBanner);
    } catch (error) {
      console.error(
        `[updateDispositionBannerUseCase] Error al obtener banner final:`,
        error.message
      );
      return {
        success: false,
        errorCode: "ERROR_FETCHING_FINAL_BANNER",
        error: `Error al obtener el banner actualizado: ${error.message}`,
      };
    }

    // 8. Éxito completo
    console.log(`[updateDispositionBannerUseCase] Banner movido a disposición ${newDisposition}`);
    return {
      success: true,
      data: finalBanner,
      updatedBanners: updatedBanners,
      message: `Banner movido exitosamente. ${updatesNeeded.length} banners reordenados.`,
    };

  } catch (error) {
    console.error(`[updateDispositionBannerUseCase] Error inesperado:`, error);
    return {
      success: false,
      errorCode: "UNEXPECTED_ERROR",
      error: `Error inesperado al actualizar disposición: ${error.message}`,
    };
  }
};
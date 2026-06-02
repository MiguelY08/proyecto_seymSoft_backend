import { VendingRepository } from "../repositories/vendingRepository.js";

/**
 * Use-Case: Obtener métricas de ventas
 *
 * Responsabilidades:
 * - Consultar métricas generales del módulo de ventas.
 * - Retornar cantidad total de ventas.
 * - Retornar cantidad de ventas por tipo.
 * - Retornar cantidad de ventas por estado.
 *
 * Reglas de negocio:
 * - Las métricas son globales.
 * - No requiere filtros.
 * - Si no existen ventas, los conteos deben retornar cero o listas vacías.
 *
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     totalSales: number,
 *     byType: Array,
 *     byStatus: Array
 *   }|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 */
export const getVendingMetricsUseCase = async () => {
  try {
    const metrics =
      await VendingRepository.getMetrics();

    if (!metrics) {
      return {
        success: false,
        data: null,
        error:
          "Error: estructura de métricas inválida del repository",
        errorCode:
          "INVALID_REPOSITORY_RESPONSE",
      };
    }

    return {
      success: true,
      data: {
        totalSales:
          metrics.totalSales || 0,
        byType:
          metrics.byType || [],
        byStatus:
          metrics.byStatus || [],
      },
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[GetVendingMetricsUseCase] Error:",
      error.message
    );

    return {
      success: false,
      data: null,
      error:
        "Error obteniendo métricas de ventas: " +
        error.message,
      errorCode:
        "DATABASE_ERROR",
    };
  }
};

export const getMetrics =
  getVendingMetricsUseCase;

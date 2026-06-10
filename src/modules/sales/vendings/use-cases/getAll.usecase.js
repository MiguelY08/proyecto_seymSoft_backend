import { VendingRepository } from "../repositories/vendingRepository.js";

/**
 * Use-Case: Obtener todas las ventas
 *
 * Responsabilidades:
 * - Aplicar lógica de negocio para el listado de ventas.
 * - Llamar al repository con filtros validados.
 * - Retornar ventas con sus relaciones principales.
 * - Mantener la estructura de paginación esperada por el controller.
 *
 * Reglas de negocio:
 * - Soporta paginación.
 * - Soporta filtros por estado, tipo, método de pago, empleado, pedido y fechas.
 * - El filtro idPaymentMethod representa ventas que incluyan ese método de pago.
 * - No debe fallar si no existen ventas; retorna una lista vacía.
 *
 * @param {Object} filters - Filtros de búsqueda validados
 * @param {number} filters.page - Número de página
 * @param {number} filters.limit - Ventas por página
 * @param {number} filters.idSaleStatus - Filtro por estado de venta
 * @param {number} filters.idSaleType - Filtro por tipo de venta
 * @param {number} filters.idPaymentMethod - Filtro por método de pago incluido
 * @param {number} filters.idEmployee - Filtro por vendedor
 * @param {number} filters.idOrder - Filtro por pedido
 * @param {string} filters.dateFrom - Fecha inicial YYYY-MM-DD
 * @param {string} filters.dateTo - Fecha final YYYY-MM-DD
 * @param {string} filters.sortBy - Campo de orden
 * @param {string} filters.order - Dirección de orden
 *
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     sales: Array,
 *     total: number,
 *     page: number,
 *     limit: number,
 *     totalPages: number,
 *     hasNextPage: boolean,
 *     hasPrevPage: boolean
 *   }|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 */
export const getAllVendingsUseCase = async (filters = {}) => {
  try {
    const result =
      await VendingRepository.findAllWithFilters(
        filters
      );

    if (!result || !Array.isArray(result.sales)) {
      return {
        success: false,
        data: null,
        error:
          "Error: estructura de datos inválida del repository",
        errorCode:
          "INVALID_REPOSITORY_RESPONSE",
      };
    }

    return {
      success: true,
      data: {
        sales:
          result.sales,
        total:
          result.total,
        page:
          result.page,
        limit:
          result.limit,
        totalPages:
          result.totalPages,
        hasNextPage:
          result.hasNextPage,
        hasPrevPage:
          result.hasPrevPage,
      },
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[GetAllVendingsUseCase] Error:",
      error.message
    );

    return {
      success: false,
      data: null,
      error:
        "Error al obtener ventas: " +
        error.message,
      errorCode:
        "DATABASE_ERROR",
    };
  }
};

export const getAll =
  getAllVendingsUseCase;

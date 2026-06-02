import { VendingRepository } from "../repositories/vendingRepository.js";

const VENDING_TYPES = [
  "manual",
  "direct",
  "web",
];

/**
 * Use-Case: Obtener ventas por tipo
 *
 * Responsabilidades:
 * - Validar el tipo de venta solicitado.
 * - Resolver el tipo de venta contra el catálogo sale_types.
 * - Reutilizar el listado de ventas con filtros.
 * - Retornar paginación y ventas del tipo indicado.
 *
 * Reglas de negocio:
 * - Los tipos permitidos desde ruta son: manual, direct, web.
 * - No se usan IDs quemados; el ID real se toma desde sale_types.
 * - Puede combinarse con filtros generales como estado, método de pago,
 *   empleado, pedido y rango de fechas.
 *
 * @param {string} vendingType - Tipo de venta solicitado
 * @param {Object} filters - Filtros de búsqueda validados
 *
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: Object|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 */
export const getVendingsByTypeUseCase = async (
  vendingType,
  filters = {}
) => {
  try {
    const normalizedType =
      String(vendingType || "")
        .trim()
        .toLowerCase();

    if (!VENDING_TYPES.includes(normalizedType)) {
      return {
        success: false,
        data: null,
        error:
          "Tipo de venta inválido",
        errorCode:
          "INVALID_SALE_TYPE",
      };
    }

    const saleType =
      await VendingRepository.findSaleTypeByName(
        normalizedType
      );

    if (!saleType) {
      return {
        success: false,
        data: null,
        error:
          `El tipo de venta ${normalizedType} no existe`,
        errorCode:
          "SALE_TYPE_NOT_FOUND",
      };
    }

    const result =
      await VendingRepository.findAllWithFilters({
        ...filters,
        idSaleType:
          saleType.id_sale_type,
      });

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
        type: {
          idSaleType:
            saleType.id_sale_type,
          saleTypeName:
            saleType.sale_type_name,
        },
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
      "[GetVendingsByTypeUseCase] Error:",
      error.message
    );

    return {
      success: false,
      data: null,
      error:
        "Error al obtener ventas por tipo: " +
        error.message,
      errorCode:
        "DATABASE_ERROR",
    };
  }
};

export const getByType =
  getVendingsByTypeUseCase;

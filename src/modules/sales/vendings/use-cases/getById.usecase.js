import { VendingRepository } from "../repositories/vendingRepository.js";

/**
 * Use-Case: Obtener venta por ID
 *
 * Responsabilidades:
 * - Aplicar lógica de negocio para consultar una venta específica.
 * - Validar que el ID sea válido.
 * - Consultar la venta con sus relaciones principales.
 * - Retornar null cuando la venta no existe.
 *
 * Reglas de negocio:
 * - El ID de venta debe ser un número entero positivo.
 * - La venta retornada debe incluir pedido, cliente, vendedor, estado, tipo
 *   y métodos de pago asociados.
 *
 * @param {number} idSale - ID de la venta a consultar
 *
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: Object|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 */
export const getVendingByIdUseCase = async (idSale) => {
  try {
    if (!idSale || isNaN(idSale) || Number(idSale) < 1) {
      return {
        success: false,
        data: null,
        error:
          "ID de venta inválido",
        errorCode:
          "VALIDATION_ERROR",
      };
    }

    const sale =
      await VendingRepository.findById(
        Number(idSale)
      );

    if (!sale) {
      return {
        success: false,
        data: null,
        error:
          "Venta no encontrada",
        errorCode:
          "SALE_NOT_FOUND",
      };
    }

    return {
      success: true,
      data:
        sale,
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[GetVendingByIdUseCase] Error:",
      error.message
    );

    return {
      success: false,
      data: null,
      error:
        "Error al obtener venta: " +
        error.message,
      errorCode:
        "DATABASE_ERROR",
    };
  }
};

export const getById =
  getVendingByIdUseCase;

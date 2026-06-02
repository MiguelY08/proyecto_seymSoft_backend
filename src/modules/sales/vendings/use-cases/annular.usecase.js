import { VendingRepository } from "../repositories/vendingRepository.js";

const ANNULLED_SALE_STATUS_ID = 4;
const CANCELLED_ORDER_STATUS_ID = 4;

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const isAnnulledStatus = (status) => {
  if (
    status?.idSaleStatus === ANNULLED_SALE_STATUS_ID ||
    status?.id_sale_status === ANNULLED_SALE_STATUS_ID
  ) {
    return true;
  }

  const name =
    normalizeText(
      status?.nameStatus ||
      status?.name_status
    );

  return name.includes("anulad");
};

/**
 * Use-Case: Anular venta
 *
 * Responsabilidades:
 * - Validar que la venta exista.
 * - Cambiar el estado de la venta a "Anulada".
 * - Cambiar el estado del pedido a "Cancelada".
 * - Retornar al stock los productos relacionados con el pedido.
 * - Exigir motivo de anulación desde el validator/controller.
 *
 * Reglas de negocio:
 * - Una venta anulada no puede anularse nuevamente.
 * - La anulación actualiza venta, pedido y stock en una transacción.
 * - Estado de venta anulada: ID 4.
 * - Estado de pedido cancelado: ID 4.
 *
 * @param {Object} params
 * @param {number} params.idSale - ID de la venta a anular
 * @param {string} params.annulmentReason - Motivo de anulación
 *
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: Object|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 */
export const annularVendingUseCase = async (params) => {
  try {
    const {
      idSale,
      annulmentReason,
    } = params;

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

    if (!annulmentReason || !String(annulmentReason).trim()) {
      return {
        success: false,
        data: null,
        error:
          "El motivo de anulación es obligatorio",
        errorCode:
          "ANNULMENT_REASON_REQUIRED",
      };
    }

    const existingSale =
      await VendingRepository.findById(
        Number(idSale)
      );

    if (!existingSale) {
      return {
        success: false,
        data: null,
        error:
          "Venta no encontrada",
        errorCode:
          "SALE_NOT_FOUND",
      };
    }

    if (isAnnulledStatus(existingSale.saleStatus)) {
      return {
        success: false,
        data: null,
        error:
          "La venta ya se encuentra anulada",
        errorCode:
          "SALE_ALREADY_ANNULLED",
      };
    }

    const annulledSaleStatus =
      await VendingRepository.findSaleStatusById(
        ANNULLED_SALE_STATUS_ID
      );

    if (!annulledSaleStatus) {
      return {
        success: false,
        data: null,
        error:
          "No existe el estado de venta Anulada",
        errorCode:
          "ANNULLED_SALE_STATUS_NOT_FOUND",
      };
    }

    const cancelledOrderStatus =
      await VendingRepository.findOrderStatusById(
        CANCELLED_ORDER_STATUS_ID
      );

    if (!cancelledOrderStatus) {
      return {
        success: false,
        data: null,
        error:
          "No existe el estado de pedido Cancelado",
        errorCode:
          "CANCELLED_ORDER_STATUS_NOT_FOUND",
      };
    }

    const updatedSale =
      await VendingRepository.annular(
        Number(idSale),
        {
          idSaleStatus:
            annulledSaleStatus.id_sale_status,
          idOrderStatus:
            cancelledOrderStatus.id_order_status,
          annulmentReason:
            String(annulmentReason).trim(),
        }
      );

    if (!updatedSale) {
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
      data: {
        sale:
          updatedSale,
        annulmentReason:
          String(annulmentReason).trim(),
      },
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[AnnularVendingUseCase] Error:",
      error.message
    );

    return {
      success: false,
      data: null,
      error:
        "Error anulando venta: " +
        error.message,
      errorCode:
        "DATABASE_ERROR",
    };
  }
};

export const annular =
  annularVendingUseCase;

import {
  ORDER_STATUSES,
  SALE_STATUSES,
} from "../../../../shared/constants/generalStatuses.js";
import { VendingRepository } from "../repositories/vendingRepository.js";

const ANNULLED_SALE_STATUS_ID = SALE_STATUSES[4].id;
const CANCELLED_ORDER_STATUS_ID = ORDER_STATUSES[4].id;

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
 * - Cambiar el estado de la venta a Anulada.
 * - Cambiar el estado del pedido a Cancelado.
 * - Retornar al stock los productos relacionados con el pedido.
 * - Restaurar cupo del cliente si la venta tenia credito.
 * - Exigir motivo de anulacion desde el validator/controller.
 *
 * Reglas de negocio:
 * - Una venta anulada no puede anularse nuevamente.
 * - La anulacion actualiza venta, pedido, stock y cupo en una transaccion.
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
          "ID de venta invalido",
        errorCode:
          "VALIDATION_ERROR",
      };
    }

    if (!annulmentReason || !String(annulmentReason).trim()) {
      return {
        success: false,
        data: null,
        error:
          "El motivo de anulacion es obligatorio",
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

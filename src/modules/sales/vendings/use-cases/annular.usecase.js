import {
  ORDER_STATUSES,
  SALE_STATUSES,
} from "../../../../shared/constants/generalStatuses.js";
import { EmailService } from "../../../../shared/services/emailService.js";
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

export const notifySaleAnnulled = async ({ sale, reason }) => {
  const customer = sale?.order?.customer;
  const user = customer?.user;

  if (!user?.email) {
    return;
  }

  try {
    await EmailService.sendSaleAnnulledEmail({
      to: user.email,
      fullName: user.fullName,
      saleId: sale.idSale,
      orderId: sale.idOrder,
      reason,
      total: sale.order?.total || sale.subtotal,
      creditRestoredAmount: sale.credit?.remainingBalance || 0,
      shippingAmount: sale.order?.shippingAmount,
      deliveryType: sale.order?.deliveryType,
      deliveryAddress: sale.order?.deliveryAddress,
      deliveryRecipientName: sale.order?.deliveryRecipientName,
      deliveryDepartment: sale.order?.deliveryDepartment,
      deliveryCity: sale.order?.deliveryCity,
    });
  } catch (error) {
    console.error(
      "[NotifySaleAnnulled] Email error:",
      error.message
    );
  }
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
 * - Restaurar saldo a favor del cliente si fue usado como metodo de pago.
 * - Notificar al cliente el motivo de anulacion.
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
      await VendingRepository.findAnnulmentStateById(
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

    const reason =
      String(annulmentReason).trim();

    const updatedSale =
      await VendingRepository.annular(
        Number(idSale),
        {
          idSaleStatus:
            ANNULLED_SALE_STATUS_ID,
          idOrderStatus:
            CANCELLED_ORDER_STATUS_ID,
          annulmentReason:
            reason,
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
          reason,
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

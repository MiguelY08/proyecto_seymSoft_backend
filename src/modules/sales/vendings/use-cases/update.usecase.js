import { VendingRepository } from "../repositories/vendingRepository.js";

const DELIVERY_TYPES = [
  "pickup",
  "delivery",
];

const APPROVED_SALE_STATUS_ID = 1;

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const isApprovedStatus = (status) => {
  if (
    status?.idSaleStatus === APPROVED_SALE_STATUS_ID ||
    status?.id_sale_status === APPROVED_SALE_STATUS_ID
  ) {
    return true;
  }

  const name =
    normalizeText(
      status?.nameStatus ||
      status?.name_status
    );

  return name.includes("aprob");
};

/**
 * Use-Case: Actualizar venta
 *
 * Responsabilidades:
 * - Aplicar reglas de negocio para modificar una venta existente.
 * - Permitir modificar tipo de entrega y dirección cuando aplica.
 * - Permitir modificar estado de venta solo si aún no está aprobada.
 * - Permitir modificar estado del pedido solo cuando la venta está aprobada.
 *
 * Reglas de negocio:
 * - Si la venta ya está en estado "Aprobada", su estado no puede cambiar.
 * - El estado del pedido solo puede cambiar cuando la venta queda o está aprobada.
 * - Tipo de entrega "pickup": el cliente recoge, se limpia la dirección.
 * - Tipo de entrega "delivery": requiere dirección de entrega.
 * - El schema actual no tiene campo deliveryType; se persiste mediante
 *   sales_orders.delivery_adress.
 *
 * @param {Object} params
 * @param {number} params.idSale - ID de la venta a actualizar
 * @param {Object} params.updateData - Datos validados para actualizar
 *
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: Object|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 */
export const updateVendingUseCase = async (params) => {
  try {
    const {
      idSale,
      updateData,
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

    if (!updateData || Object.keys(updateData).length === 0) {
      return {
        success: false,
        data: null,
        error:
          "Debe proporcionar al menos un campo para actualizar",
        errorCode:
          "NO_DATA_TO_UPDATE",
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

    const updatePayload = {};

    const currentSaleIsApproved =
      isApprovedStatus(
        existingSale.saleStatus
      );

    let resultingSaleIsApproved =
      currentSaleIsApproved;

    if (updateData.idSaleStatus !== undefined) {
      if (currentSaleIsApproved) {
        return {
          success: false,
          data: null,
          error:
            "No se puede cambiar el estado de una venta aprobada",
          errorCode:
            "SALE_ALREADY_APPROVED",
        };
      }

      const saleStatus =
        await VendingRepository.findSaleStatusById(
          updateData.idSaleStatus
        );

      if (!saleStatus) {
        return {
          success: false,
          data: null,
          error:
            "Estado de venta no encontrado",
          errorCode:
            "SALE_STATUS_NOT_FOUND",
        };
      }

      updatePayload.idSaleStatus =
        updateData.idSaleStatus;

      resultingSaleIsApproved =
        isApprovedStatus(
          saleStatus
        );
    }

    if (updateData.deliveryType !== undefined) {
      const deliveryType =
        normalizeText(
          updateData.deliveryType
        );

      if (!DELIVERY_TYPES.includes(deliveryType)) {
        return {
          success: false,
          data: null,
          error:
            "Tipo de entrega inválido",
          errorCode:
            "INVALID_DELIVERY_TYPE",
        };
      }

      if (deliveryType === "delivery") {
        const deliveryAddress =
          String(updateData.deliveryAddress || "")
            .trim();

        if (!deliveryAddress) {
          return {
            success: false,
            data: null,
            error:
              "La dirección de entrega es obligatoria para domicilio",
            errorCode:
              "DELIVERY_ADDRESS_REQUIRED",
          };
        }

        updatePayload.deliveryAdress =
          deliveryAddress;
      }

      if (deliveryType === "pickup") {
        updatePayload.deliveryAdress =
          null;
      }
    }

    if (
      updateData.deliveryAddress !== undefined &&
      updateData.deliveryType === undefined
    ) {
      const deliveryAddress =
        String(updateData.deliveryAddress || "")
          .trim();

      if (!deliveryAddress) {
        return {
          success: false,
          data: null,
          error:
            "La dirección de entrega no puede estar vacía",
          errorCode:
            "INVALID_DELIVERY_ADDRESS",
        };
      }

      updatePayload.deliveryAdress =
        deliveryAddress;
    }

    if (updateData.idOrderStatus !== undefined) {
      if (!resultingSaleIsApproved) {
        return {
          success: false,
          data: null,
          error:
            "El estado del pedido solo puede modificarse cuando la venta está aprobada",
          errorCode:
            "SALE_NOT_APPROVED",
        };
      }

      const orderStatus =
        await VendingRepository.findOrderStatusById(
          updateData.idOrderStatus
        );

      if (!orderStatus) {
        return {
          success: false,
          data: null,
          error:
            "Estado de pedido no encontrado",
          errorCode:
            "ORDER_STATUS_NOT_FOUND",
        };
      }

      updatePayload.idOrderStatus =
        updateData.idOrderStatus;
    }

    if (Object.keys(updatePayload).length === 0) {
      return {
        success: false,
        data: null,
        error:
          "No hay cambios válidos para actualizar",
        errorCode:
          "NO_VALID_DATA_TO_UPDATE",
      };
    }

    const updatedSale =
      await VendingRepository.update(
        Number(idSale),
        updatePayload
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
      data:
        updatedSale,
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[UpdateVendingUseCase] Error:",
      error.message
    );

    return {
      success: false,
      data: null,
      error:
        "Error actualizando venta: " +
        error.message,
      errorCode:
        "DATABASE_ERROR",
    };
  }
};

export const update =
  updateVendingUseCase;

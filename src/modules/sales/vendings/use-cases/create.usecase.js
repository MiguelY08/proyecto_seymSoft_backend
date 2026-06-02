import { VendingRepository } from "../repositories/vendingRepository.js";
import { OrdersService } from "../service/orders.js";

const VENDING_TYPES = [
  "manual",
  "direct",
  "web",
];

const EMPLOYEE_REQUIRED_TYPES = [
  "manual",
  "direct",
];

const SYSTEM_EMPLOYEE_ID = 7;

const roundMoney = (value) => {
  return Math.round(Number(value) * 100) / 100;
};

const getWebEmployeeId = () => {
  const idEmployee =
    Number(process.env.WEB_SALES_EMPLOYEE_ID);

  return !isNaN(idEmployee) && idEmployee > 0
    ? idEmployee
    : SYSTEM_EMPLOYEE_ID;
};

/**
 * Use-Case: Crear venta
 *
 * Responsabilidades:
 * - Validar el tipo de venta recibido desde la ruta.
 * - Resolver el tipo de venta contra el catálogo sale_types.
 * - Validar que el pedido exista y no tenga una venta asociada.
 * - Calcular el subtotal desde los detalles del pedido.
 * - Validar estado de venta, empleado y métodos de pago.
 * - Crear la venta con sus métodos de pago.
 * - Descontar del stock los productos relacionados con el pedido.
 *
 * Reglas de negocio:
 * - Las ventas manuales y directas son generadas por un empleado autenticado.
 * - La venta web puede generarse por el cliente; mientras sales.id_employe
 *   sea obligatorio, se registra con WEB_SALES_EMPLOYEE_ID.
 * - idEmployee no viene del body; lo entrega la sesión/JWT al controller.
 * - idSaleType no viene del body; se resuelve desde vendingType.
 * - subtotal no viene del body; se calcula desde el pedido.
 * - Una venta no puede crearse dos veces para el mismo pedido.
 * - Una venta puede tener uno o varios métodos de pago.
 * - Si se envían montos por método, la suma no puede superar el total.
 *
 * @param {Object} params
 * @param {string} params.vendingType - manual, direct o web
 * @param {number} params.idEmployee - Empleado autenticado, excepto web
 * @param {number} params.idUser - Usuario autenticado para resolver empleado
 * @param {Object} params.data - Datos validados del body
 *
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: Object|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 */
export const createVendingUseCase = async (params) => {
  try {
    const {
      vendingType,
      idEmployee,
      idUser,
      data,
    } = params;

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

    let resolvedEmployeeId =
      Number(idEmployee);

    if (
      (!resolvedEmployeeId || isNaN(resolvedEmployeeId)) &&
      idUser
    ) {
      const employeeByUser =
        await VendingRepository.findEmployeeByUserId(
          idUser
        );

      if (employeeByUser) {
        resolvedEmployeeId =
          employeeByUser.id_employee;
      }
    }

    if (normalizedType === "web" && (!resolvedEmployeeId || isNaN(resolvedEmployeeId))) {
      resolvedEmployeeId =
        getWebEmployeeId();
    }

    if (
      EMPLOYEE_REQUIRED_TYPES.includes(normalizedType) &&
      (!resolvedEmployeeId || isNaN(resolvedEmployeeId))
    ) {
      return {
        success: false,
        data: null,
        error:
          "Empleado autenticado requerido para registrar esta venta",
        errorCode:
          "EMPLOYEE_REQUIRED",
      };
    }

    if (!resolvedEmployeeId || isNaN(resolvedEmployeeId)) {
      return {
        success: false,
        data: null,
        error:
          "No hay empleado configurado para registrar ventas web",
        errorCode:
          "WEB_EMPLOYEE_NOT_CONFIGURED",
      };
    }

    const employee =
      await VendingRepository.findEmployeeById(
        resolvedEmployeeId
      );

    if (!employee) {
      return {
        success: false,
        data: null,
        error:
          "Empleado no encontrado",
        errorCode:
          "EMPLOYEE_NOT_FOUND",
      };
    }

    const saleStatus =
      await VendingRepository.findSaleStatusById(
        data.idSaleStatus
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

    const orderResult =
      await OrdersService.findAvailableForSale(
        data.idOrder
      );

    if (!orderResult.success) {
      return {
        success: false,
        data: null,
        error:
          orderResult.error,
        errorCode:
          orderResult.errorCode,
      };
    }

    const order =
      orderResult.data;

    const stockValidation =
      await VendingRepository.validateStockForOrder(
        order
      );

    if (!stockValidation.success) {
      return {
        success: false,
        data: null,
        error:
          stockValidation.error,
        errorCode:
          stockValidation.errorCode,
      };
    }

    const paymentMethods = [];

    for (const paymentMethod of data.paymentMethods) {
      const paymentMethodExists =
        await VendingRepository.findPaymentMethodById(
          paymentMethod.idPaymentMethod
        );

      if (!paymentMethodExists) {
        return {
          success: false,
          data: null,
          error:
            `El método de pago ${paymentMethod.idPaymentMethod} no existe`,
          errorCode:
            "PAYMENT_METHOD_NOT_FOUND",
        };
      }

      paymentMethods.push(
        paymentMethod
      );
    }

    const totals =
      OrdersService.calculateTotals(
        order
      );

    const paymentsWithAmount =
      paymentMethods.filter(
        (paymentMethod) =>
          paymentMethod.amount !== undefined &&
          paymentMethod.amount !== null
      );

    if (paymentsWithAmount.length > 0) {
      const paidAmount =
        roundMoney(
          paymentsWithAmount.reduce(
            (total, paymentMethod) =>
              total + Number(paymentMethod.amount),
            0
          )
        );

      if (paidAmount > totals.total) {
        return {
          success: false,
          data: null,
          error:
            "La suma de los métodos de pago no puede superar el total de la venta",
          errorCode:
            "PAYMENT_AMOUNT_EXCEEDS_TOTAL",
        };
      }
    }

    const sale =
      await VendingRepository.create({
        idOrder:
          data.idOrder,
        idEmployee:
          resolvedEmployeeId,
        subtotal:
          totals.subtotal,
        idSaleStatus:
          data.idSaleStatus,
        idSaleType:
          saleType.id_sale_type,
        paymentMethods,
        orderDetails:
          order.details,
        decreaseStock: true,
      });

    return {
      success: true,
      data: {
        sale,
        totals,
      },
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[CreateVendingUseCase] Error:",
      error.message
    );

    let errorCode =
      "DATABASE_ERROR";

    if (error.code === "P2002") {
      errorCode =
        "DUPLICATE_SALE_ORDER";
    }

    return {
      success: false,
      data: null,
      error:
        "Error creando venta: " +
        error.message,
      errorCode,
    };
  }
};

export const create =
  createVendingUseCase;

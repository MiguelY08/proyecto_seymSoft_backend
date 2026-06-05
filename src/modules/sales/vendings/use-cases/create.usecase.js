import { VendingRepository } from "../repositories/vendingRepository.js";
import { CreateOrderDto } from "../../orders/dtos/createOrder.dto.js";
import { CreateOrderUseCase } from "../../orders/use-cases/createOrderUseCase.js";
import { OrderRepository } from "../../orders/repositories/orderRepository.js";

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
const CANCELLED_ORDER_STATUS_ID = 4;

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

const getOrderId = (order) => {
  return order?.id_order ?? order?.id;
};

const getOrderStatusId = (order) => {
  return order?.id_order_status ?? order?.status?.id;
};

const getOrderDetails = (order) => {
  return order?.order_details ?? order?.details ?? [];
};

const calculateOrderTotals = (order) => {
  const details =
    getOrderDetails(order);

  const subtotal =
    order?.subtotal !== undefined && order?.subtotal !== null
      ? Number(order.subtotal)
      : roundMoney(
          details.reduce(
            (total, detail) =>
              total + Number(detail.subtotal || 0),
            0
          )
        );

  const ivaAmount =
    (order?.iva_amount ?? order?.ivaAmount) !== undefined &&
    (order?.iva_amount ?? order?.ivaAmount) !== null
      ? Number(order.iva_amount ?? order.ivaAmount)
      : roundMoney(
          details.reduce(
            (total, detail) =>
              total + Number(detail.iva_amount ?? detail.ivaAmount ?? 0),
            0
          )
        );

  const total =
    order?.total !== undefined && order?.total !== null
      ? Number(order.total)
      : roundMoney(subtotal + ivaAmount);

  return {
    subtotal:
      roundMoney(subtotal),
    ivaAmount:
      roundMoney(ivaAmount),
    total:
      roundMoney(total),
  };
};

const createOrder = async (orderData) => {
  const orderRepository =
    new OrderRepository();

  const dto =
    new CreateOrderDto(orderData);

  return await new CreateOrderUseCase(
    orderRepository
  ).execute(dto);
};

/**
 * Use-Case: Crear venta
 *
 * Responsabilidades:
 * - Validar el tipo de venta recibido desde la ruta.
 * - Resolver el tipo de venta contra el catalogo sale_types.
 * - Crear un pedido con el modulo real de pedidos cuando no exista idOrder.
 * - Validar que el pedido exista, no este cancelado y no tenga venta asociada.
 * - Calcular el subtotal desde el pedido real.
 * - Validar estado de venta, empleado y metodos de pago.
 * - Crear la venta con sus metodos de pago.
 * - Descontar del stock los productos relacionados con el pedido.
 *
 * Reglas de negocio:
 * - Las ventas manuales y directas son generadas por un empleado autenticado.
 * - La venta web usa el empleado sistema si no hay empleado autenticado.
 * - idEmployee no viene del body; lo entrega la sesion/JWT al controller.
 * - idSaleType no viene del body; se resuelve desde vendingType.
 * - subtotal no viene del body; se toma del pedido real.
 * - Una venta no puede crearse dos veces para el mismo pedido.
 * - Una venta puede tener uno o varios metodos de pago.
 * - Si se envian montos por metodo, la suma no puede superar el total.
 *
 * @param {Object} params
 * @param {string} params.vendingType - manual, direct o web
 * @param {number} params.idEmployee - Empleado autenticado, excepto web
 * @param {number} params.idUser - Usuario autenticado para resolver empleado
 * @param {Object} params.data - Datos validados del body
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
        error: "Tipo de venta invalido",
        errorCode: "INVALID_SALE_TYPE",
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
        error: `El tipo de venta ${normalizedType} no existe`,
        errorCode: "SALE_TYPE_NOT_FOUND",
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

    if (
      normalizedType === "web" &&
      (!resolvedEmployeeId || isNaN(resolvedEmployeeId))
    ) {
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
        error: "Empleado autenticado requerido para registrar esta venta",
        errorCode: "EMPLOYEE_REQUIRED",
      };
    }

    if (!resolvedEmployeeId || isNaN(resolvedEmployeeId)) {
      return {
        success: false,
        data: null,
        error: "No hay empleado configurado para registrar ventas web",
        errorCode: "WEB_EMPLOYEE_NOT_CONFIGURED",
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
        error: "Empleado no encontrado",
        errorCode: "EMPLOYEE_NOT_FOUND",
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
        error: "Estado de venta no encontrado",
        errorCode: "SALE_STATUS_NOT_FOUND",
      };
    }

    let order;
    let createdOrder = null;

    if (data.order) {
      try {
        createdOrder =
          await createOrder(data.order);
      } catch (orderError) {
        return {
          success: false,
          data: null,
          error: "Error creando pedido: " + orderError.message,
          errorCode: "ORDER_CREATION_ERROR",
        };
      }

      order =
        createdOrder;
    }

    if (data.idOrder) {
      order =
        await VendingRepository.findOrderById(
          data.idOrder
        );
    }

    if (!order) {
      return {
        success: false,
        data: null,
        error: "Pedido no encontrado",
        errorCode: "ORDER_NOT_FOUND",
      };
    }

    const idOrder =
      getOrderId(order);

    if (!idOrder) {
      return {
        success: false,
        data: null,
        error: "El pedido no tiene un ID valido",
        errorCode: "INVALID_ORDER_RESPONSE",
      };
    }

    const rawOrder =
      data.order
        ? await VendingRepository.findOrderById(idOrder)
        : order;

    if (!rawOrder) {
      return {
        success: false,
        data: null,
        error: "Pedido no encontrado",
        errorCode: "ORDER_NOT_FOUND",
      };
    }

    if (rawOrder.sales) {
      return {
        success: false,
        data: null,
        error: "El pedido ya tiene una venta asociada",
        errorCode: "ORDER_ALREADY_SOLD",
      };
    }

    if (getOrderStatusId(rawOrder) === CANCELLED_ORDER_STATUS_ID) {
      return {
        success: false,
        data: null,
        error: "No se puede crear una venta para un pedido cancelado",
        errorCode: "ORDER_CANCELLED",
      };
    }

    const orderDetails =
      getOrderDetails(rawOrder);

    if (!orderDetails.length) {
      return {
        success: false,
        data: null,
        error: "El pedido no tiene detalles",
        errorCode: "ORDER_WITHOUT_DETAILS",
      };
    }

    const stockValidation =
      await VendingRepository.validateStockForOrder({
        details:
          orderDetails,
      });

    if (!stockValidation.success) {
      return {
        success: false,
        data: null,
        error: stockValidation.error,
        errorCode: stockValidation.errorCode,
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
          error: `El metodo de pago ${paymentMethod.idPaymentMethod} no existe`,
          errorCode: "PAYMENT_METHOD_NOT_FOUND",
        };
      }

      paymentMethods.push(paymentMethod);
    }

    const totals =
      calculateOrderTotals(rawOrder);

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
          error: "La suma de los metodos de pago no puede superar el total de la venta",
          errorCode: "PAYMENT_AMOUNT_EXCEEDS_TOTAL",
        };
      }
    }

    const sale =
      await VendingRepository.create({
        idOrder,
        idEmployee:
          resolvedEmployeeId,
        subtotal:
          totals.subtotal,
        idSaleStatus:
          data.idSaleStatus,
        idSaleType:
          saleType.id_sale_type,
        paymentMethods,
        orderDetails,
        decreaseStock: true,
      });

    return {
      success: true,
      data: {
        sale,
        order:
          createdOrder,
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

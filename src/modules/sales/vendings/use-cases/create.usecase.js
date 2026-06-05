import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  SALE_STATUSES,
} from "../../../../shared/constants/generalStatuses.js";
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
const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;

const roundMoney = (value) => {
  return Math.round(Number(value || 0) * 100) / 100;
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

const getOrderCustomerId = (order) => {
  return order?.id_customer ?? order?.customerId ?? order?.customer?.id;
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

const getPaidAmount = (paymentMethods = []) =>
  roundMoney(
    paymentMethods.reduce(
      (total, paymentMethod) =>
        total + Number(paymentMethod.amount || 0),
      0
    )
  );

const getCreditAmount = (paymentMethods = []) =>
  roundMoney(
    paymentMethods
      .filter((paymentMethod) => Number(paymentMethod.idPaymentMethod) === CREDIT_PAYMENT_METHOD_ID)
      .reduce(
        (total, paymentMethod) => total + Number(paymentMethod.amount || 0),
        0
      )
  );

const buildPaymentMethodsFromOrderPayments = (orderPayments = []) => {
  const grouped = new Map();

  for (const payment of orderPayments) {
    const idPaymentMethod = Number(payment.id_payment_method);
    const amount = Number(payment.amount || 0);

    grouped.set(
      idPaymentMethod,
      roundMoney((grouped.get(idPaymentMethod) || 0) + amount)
    );
  }

  return Array.from(grouped.entries()).map(
    ([idPaymentMethod, amount]) => ({
      idPaymentMethod,
      amount,
    })
  );
};

/**
 * Use-Case: Crear venta
 *
 * Reglas principales:
 * - La API de Ventas crea primero el pedido y luego la venta.
 * - La generacion automatica desde Pedidos puede usar idOrder interno.
 * - Una venta exige pago completo: la suma de metodos debe igualar el total.
 * - Si se usa Credito, se valida y descuenta el cupo del cliente en repository.
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
    const createsOrderFromSale = Boolean(data.order);

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
      await VendingRepository.findOrderById(idOrder);

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

    if (getOrderStatusId(rawOrder) === ORDER_STATUSES[4].id) {
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

    const paymentMethods =
      data.paymentMethods?.length
        ? data.paymentMethods
        : buildPaymentMethodsFromOrderPayments(rawOrder.order_payments || []);

    if (!paymentMethods.length) {
      return {
        success: false,
        data: null,
        error: "Debe registrar al menos un metodo de pago para crear la venta",
        errorCode: "PAYMENT_METHODS_REQUIRED",
      };
    }

    for (const paymentMethod of paymentMethods) {
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
    }

    const totals =
      calculateOrderTotals(rawOrder);

    const paidAmount =
      getPaidAmount(paymentMethods);

    if (paidAmount !== totals.total) {
      return {
        success: false,
        data: null,
        error: "La suma de los metodos de pago debe ser igual al total de la venta",
        errorCode: "PAYMENT_AMOUNT_MUST_MATCH_TOTAL",
      };
    }

    const creditAmount =
      getCreditAmount(paymentMethods);

    if (creditAmount > 0 && !data.credit) {
      return {
        success: false,
        data: null,
        error: "Debe enviar los datos del credito cuando usa metodo de pago Credito",
        errorCode: "CREDIT_DATA_REQUIRED",
      };
    }

    if (data.credit && creditAmount <= 0) {
      return {
        success: false,
        data: null,
        error: "No debe enviar datos de credito si no usa metodo de pago Credito",
        errorCode: "CREDIT_DATA_NOT_ALLOWED",
      };
    }

    const sale =
      await VendingRepository.create({
        idOrder,
        idEmployee:
          resolvedEmployeeId,
        subtotal:
          totals.subtotal,
        idSaleStatus:
          data.idSaleStatus || SALE_STATUSES[1].id,
        idSaleType:
          saleType.id_sale_type,
        paymentMethods,
        credit:
          data.credit,
        orderDetails,
        decreaseStock: true,
        markOrderAsPaid:
          createsOrderFromSale,
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

    if (error.message?.includes("credito")) {
      errorCode =
        "CREDIT_ERROR";
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

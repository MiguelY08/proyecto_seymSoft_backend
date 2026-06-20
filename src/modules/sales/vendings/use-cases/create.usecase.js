import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  SALE_STATUSES,
} from "../../../../shared/constants/generalStatuses.js";
import { VendingRepository } from "../repositories/vendingRepository.js";
import { EmailService } from "../../../../shared/services/emailService.js";
import { CreateOrderDto } from "../../orders/dtos/createOrder.dto.js";
import { CreateOrderUseCase } from "../../orders/use-cases/createOrderUseCase.js";
import { OrderRepository } from "../../orders/repositories/orderRepository.js";

const VENDING_TYPES = [
  "manual",
  "direct",
  "web",
];

const SALE_TYPE_CATALOG_NAMES = {
  manual: "MANUAL",
  direct: "DIRECTA",
  web: "WEB",
};

const EMPLOYEE_REQUIRED_TYPES = [
  "manual",
  "direct",
];

const SYSTEM_EMPLOYEE_ID = 7;
const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;
const DIRECT_VENDING_TYPE = "direct";
const DELIVERED_ORDER_STATUS_ID = ORDER_STATUSES[3].id;

const roundMoney = (value) => {
  return Math.round(Number(value || 0) * 100) / 100;
};

const resolveEmployeeFromSession = async ({ idEmployee, idUser }) => {
  const userId = Number(idUser);

  if (userId && !isNaN(userId)) {
    const employeeByUser =
      await VendingRepository.findEmployeeByUserId(
        userId
      );

    if (employeeByUser) {
      return {
        employee: employeeByUser,
        idEmployee:
          employeeByUser.id_employee,
        source: "user",
      };
    }
  }

  const receivedEmployeeId = Number(idEmployee);

  if (receivedEmployeeId && !isNaN(receivedEmployeeId)) {
    const employeeById =
      await VendingRepository.findEmployeeById(
        receivedEmployeeId
      );

    if (employeeById) {
      return {
        employee: employeeById,
        idEmployee:
          employeeById.id_employee,
        source: "employee",
      };
    }

    const employeeByUser =
      await VendingRepository.findEmployeeByUserId(
        receivedEmployeeId
      );

    if (employeeByUser) {
      return {
        employee: employeeByUser,
        idEmployee:
          employeeByUser.id_employee,
        source: "employeeBodyAsUser",
      };
    }
  }

  return {
    employee: null,
    idEmployee: null,
    source: null,
  };
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

const prepareOrder = async (orderData) => {
  const orderRepository =
    new OrderRepository();

  const dto =
    new CreateOrderDto(orderData);

  const orderUseCase =
    new CreateOrderUseCase(
      orderRepository
    );

  return {
    orderUseCase,
    orderData:
      await orderUseCase.prepare(dto),
  };
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

const validateClientCreditLimit = async ({ idCustomer, creditAmount }) => {
  if (creditAmount <= 0) {
    return {
      success: true,
      error: null,
      errorCode: null,
    };
  }

  const capacity =
    await VendingRepository.getClientCreditCapacity(
      idCustomer
    );

  if (!capacity) {
    return {
      success: false,
      error: "Cliente no encontrado",
      errorCode: "CLIENT_NOT_FOUND",
    };
  }

  if (!capacity.isActive) {
    return {
      success: false,
      error: "El cliente no se encuentra activo",
      errorCode: "CLIENT_INACTIVE",
    };
  }

  if (capacity.hasOverdueCredit) {
    return {
      success: false,
      error: "El cliente tiene creditos vencidos y no puede realizar nuevas compras a credito",
      errorCode: "CLIENT_HAS_OVERDUE_CREDITS",
    };
  }

  if (capacity.assignedCredit <= 0) {
    return {
      success: false,
      error: "El cliente no tiene cupo de credito asignado",
      errorCode: "CLIENT_WITHOUT_CREDIT_LIMIT",
    };
  }

  if (creditAmount > capacity.availableCredit) {
    return {
      success: false,
      error: "El cupo disponible calculado del cliente no es suficiente para la venta a credito",
      errorCode: "CREDIT_LIMIT_EXCEEDED",
    };
  }

  return {
    success: true,
    error: null,
    errorCode: null,
  };
};


const notifySaleCreated = async (saleSummary) => {
  if (!saleSummary?.idSale) {
    return;
  }

  try {
    const sale =
      await VendingRepository.findSaleEmailPayloadById(
        saleSummary?.idSale
      );

    const customer =
      sale?.customer;
    const user =
      customer?.user;

    if (!user?.email) {
      return;
    }

    await EmailService.sendSaleCreatedEmail({
      to: user.email,
      fullName: user.fullName,
      saleId: sale.idSale,
      orderId: sale.idOrder,
      paymentMethods: sale.paymentMethods,
      details: sale.details,
      subtotal: sale.subtotal,
      total: sale.total,
      credit: sale.credit,
    });
  } catch (error) {
    console.error(
      "[CreateVendingUseCase] Email error:",
      error.message
    );
  }
};

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
      dryRun = false,
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
        SALE_TYPE_CATALOG_NAMES[normalizedType] || normalizedType
      );

    if (!saleType) {
      return {
        success: false,
        data: null,
        error: `El tipo de venta ${normalizedType} no existe`,
        errorCode: "SALE_TYPE_NOT_FOUND",
      };
    }

    const resolvedEmployee =
      await resolveEmployeeFromSession({
        idEmployee,
        idUser,
      });

    let resolvedEmployeeId =
      resolvedEmployee.idEmployee;

    let employee =
      resolvedEmployee.employee;

    if (
      normalizedType === "web" &&
      (!resolvedEmployeeId || isNaN(resolvedEmployeeId))
    ) {
      resolvedEmployeeId =
        getWebEmployeeId();

      employee =
        await VendingRepository.findEmployeeById(
          resolvedEmployeeId
        );
    }

    if (
      EMPLOYEE_REQUIRED_TYPES.includes(normalizedType) &&
      (!resolvedEmployeeId || isNaN(resolvedEmployeeId))
    ) {
      return {
        success: false,
        data: null,
        error: "El usuario autenticado no esta relacionado con un empleado",
        errorCode: "EMPLOYEE_USER_NOT_LINKED",
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

    if (!employee) {
      employee =
        await VendingRepository.findEmployeeById(
          resolvedEmployeeId
        );
    }

    if (!employee) {
      return {
        success: false,
        data: null,
        error: "Empleado no encontrado o usuario no relacionado con empleado",
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
    let rawOrder = null;
    let idOrder = null;
    let orderDetails = [];
    let totals = null;
    let preparedOrder = null;
    const createsOrderFromSale = Boolean(data.order);
    const directSaleOrderStatus =
      normalizedType === DIRECT_VENDING_TYPE
        ? DELIVERED_ORDER_STATUS_ID
        : null;

    if (data.order) {
      try {
        preparedOrder =
          await prepareOrder(data.order);

        totals = {
          subtotal:
            roundMoney(preparedOrder.orderData.subtotal),
          ivaAmount:
            roundMoney(preparedOrder.orderData.ivaAmount),
          total:
            roundMoney(preparedOrder.orderData.total),
        };

        orderDetails =
          preparedOrder.orderData.items.map((item) => ({
            id_product:
              Number(item.idProduct ?? item.id_product),
            idProduct:
              Number(item.idProduct ?? item.id_product),
            barcode:
              item.barcode,
            quantity:
              Number(item.quantity),
            unit_price:
              item.unitPrice,
            unitPrice:
              item.unitPrice,
            subtotal:
              item.subtotal,
            iva_amount:
              item.ivaAmount,
            ivaAmount:
              item.ivaAmount,
          }));
      } catch (orderError) {
        return {
          success: false,
          data: null,
          error: "Error validando pedido: " + orderError.message,
          errorCode: "ORDER_CREATION_ERROR",
        };
      }
    }

    if (data.idOrder) {
      order =
        await VendingRepository.findOrderById(
          data.idOrder
        );

      if (!order) {
        return {
          success: false,
          data: null,
          error: "Pedido no encontrado",
          errorCode: "ORDER_NOT_FOUND",
        };
      }

      idOrder =
        getOrderId(order);

      if (!idOrder) {
        return {
          success: false,
          data: null,
          error: "El pedido no tiene un ID valido",
          errorCode: "INVALID_ORDER_RESPONSE",
        };
      }

      rawOrder =
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

      orderDetails =
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

      totals =
        calculateOrderTotals(rawOrder);
    }

    if (!data.order && !data.idOrder) {
      return {
        success: false,
        data: null,
        error: "Pedido no encontrado",
        errorCode: "ORDER_NOT_FOUND",
      };
    }
    const paymentMethods =
      data.paymentMethods?.length
        ? data.paymentMethods
        : buildPaymentMethodsFromOrderPayments(rawOrder?.order_payments || []);

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

    if (creditAmount > 0) {
      const creditStatus =
        await VendingRepository.findCreditStatusById(
          data.credit.idCreditStatus
        );

      if (!creditStatus) {
        return {
          success: false,
          data: null,
          error: "Estado de credito no encontrado",
          errorCode: "CREDIT_STATUS_NOT_FOUND",
        };
      }

      const idCustomer =
        data.order
          ? preparedOrder.orderData.idClient
          : getOrderCustomerId(rawOrder);

      const creditLimitValidation =
        await validateClientCreditLimit({
          idCustomer,
          creditAmount,
        });

      if (!creditLimitValidation.success) {
        return {
          success: false,
          data: null,
          error:
            creditLimitValidation.error,
          errorCode:
            creditLimitValidation.errorCode,
        };
      }
    }

    if (dryRun) {
      return {
        success: true,
        data: {
          sale: null,
          order:
            rawOrder || createdOrder,
          totals,
          dryRun: true,
        },
        error: null,
        errorCode: null,
      };
    }

    if (createsOrderFromSale) {
      try {
        preparedOrder.orderData = {
          ...preparedOrder.orderData,
          idPaymentStatus:
            PAYMENT_STATUSES[2].id,
          paymentStatus:
            PAYMENT_STATUSES[2].name,
          ...(directSaleOrderStatus && {
            idOrderStatus:
              directSaleOrderStatus,
          }),
          paymentDeadline:
            null,
          initialPayments:
            paymentMethods.map((paymentMethod) => ({
              idPaymentMethod:
                paymentMethod.idPaymentMethod,
              amount:
                paymentMethod.amount,
              observations:
                'Pago registrado desde ventas.',
            })),
        };

        createdOrder =
          await preparedOrder.orderUseCase.createPrepared(
            preparedOrder.orderData
          );

        idOrder =
          getOrderId(createdOrder);

        rawOrder =
          await VendingRepository.findOrderById(idOrder);

        orderDetails =
          getOrderDetails(rawOrder);
      } catch (orderError) {
        return {
          success: false,
          data: null,
          error: "Error creando pedido: " + orderError.message,
          errorCode: "ORDER_CREATION_ERROR",
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
          data.idSaleStatus || SALE_STATUSES[1].id,
        idSaleType:
          saleType.id_sale_type,
        paymentMethods,
        credit:
          data.credit,
        idOrderStatus:
          directSaleOrderStatus,
        orderDetails,
        decreaseStock: true,
        markOrderAsPaid:
          createsOrderFromSale,
      });

    void notifySaleCreated(sale);

    return {
      success: true,
      data: {
        sale,
        order:
          sale.order || createdOrder,
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

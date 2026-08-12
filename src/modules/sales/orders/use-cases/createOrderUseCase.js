import {
  ORDER_PAYMENT_EXPIRATION,
  ORDER_STATUSES,
  PAYMENT_METHOD_IDS,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { createVendingUseCase } from '../../vendings/use-cases/create.usecase.js';
import { mapOrder } from '../mappers/orderMapper.js';
import { notifyAdmins } from '../../../notifications/services/adminNotificationService.js';
import {
  calculateOrderTotals,
  getPriceByClientType,
} from '../helpers/orderHelpers.js';
import { requiresShippingQuote } from '../helpers/orderShippingStatus.js';
import {
  assertCanUseFavorBalance,
  getFavorBalancePaymentAmount,
} from '../../shared/favorBalance.js';

const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHOD_IDS.CREDIT;
const FAVOR_BALANCE_PAYMENT_METHOD_ID = PAYMENT_METHOD_IDS.FAVOR_BALANCE;
const IN_PROCESS_ORDER_STATUS_ID = ORDER_STATUSES[1].id;
const READY_ORDER_STATUS_ID = ORDER_STATUSES[2].id;
const DELIVERED_ORDER_STATUS_ID = ORDER_STATUSES[3].id;
const CANCELLED_ORDER_STATUS_ID = ORDER_STATUSES[4].id;
const PAID_PAYMENT_STATUS_ID = PAYMENT_STATUSES[2].id;
const PAID_ORDER_ALLOWED_STATUS_IDS = [
  READY_ORDER_STATUS_ID,
  DELIVERED_ORDER_STATUS_ID,
];
const OPERATIONAL_ORDER_STATUS_IDS = [
  READY_ORDER_STATUS_ID,
  DELIVERED_ORDER_STATUS_ID,
];

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const sumPayments = (payments = []) =>
  roundMoney(
    payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    )
  );
const buildPaymentDeadline = () => {
  const now = new Date();
  return new Date(
    now.getTime() + ORDER_PAYMENT_EXPIRATION.HOURS_TO_PAY * 60 * 60 * 1000
  );
};

const buildProductBarcodeKey = (item) =>
  `${Number(item.idProduct ?? item.id_product)}::${String(item.barcode || '').trim()}`;

const getEnrichedOrderItems = async ({ repo, items, client }) => {
  const barcodeRecords =
    await repo.findBarcodesByProducts(items);
  const barcodeRecordByItem = new Map(
    barcodeRecords.map((barcodeRecord) => [
      buildProductBarcodeKey({
        idProduct: barcodeRecord.id_product,
        barcode: barcodeRecord.barcode,
      }),
      barcodeRecord,
    ])
  );

  return items.map((item) => {
    const barcodeRecord =
      barcodeRecordByItem.get(
        buildProductBarcodeKey(item)
      );

    if (!barcodeRecord) {
      throw new AppError(
        `El codigo de barras "${item.barcode}" no pertenece al producto seleccionado.`,
        400
      );
    }

    if ((barcodeRecord.stock || 0) < item.quantity) {
      throw new AppError(
        `Stock insuficiente para el producto "${barcodeRecord.products.name}". Stock disponible: ${barcodeRecord.stock}.`,
        400
      );
    }

    const unitPrice = getPriceByClientType(
      barcodeRecord.products,
      client.client_type
    );

    if (!unitPrice || Number(unitPrice) <= 0) {
      throw new AppError(
        `El producto "${barcodeRecord.products.name}" no tiene precio configurado para el tipo de cliente "${client.client_type || 'Detal'}".`,
        400
      );
    }

    return {
      ...item,
      unitPrice: Number(unitPrice),
      ivaPercentage: Number(
        barcodeRecord.products.iva_percentage || 0
      ),
    };
  });
};

const resolveAssignedEmployeeId = async (repo, dto) => {
  const receivedEmployeeId = Number(dto.idEmployee);

  if (receivedEmployeeId && !Number.isNaN(receivedEmployeeId)) {
    const employeeById = await repo.findEmployeeById(receivedEmployeeId);
    if (employeeById) return employeeById.id_employee;

    const employeeByUser = await repo.findEmployeeByUserId(receivedEmployeeId);
    if (employeeByUser) return employeeByUser.id_employee;
  }

  const userId = Number(dto.idUser);

  if (userId && !Number.isNaN(userId)) {
    const employeeByUser = await repo.findEmployeeByUserId(userId);
    if (employeeByUser) return employeeByUser.id_employee;
  }

  return null;
};

export const notifyOrderCreated = async (order) => {
  const mappedOrder =
    order?.id_order
      ? mapOrder(order)
      : order;

  if (!mappedOrder) {
    return;
  }

  const customer = mappedOrder.customer;

  if (!customer?.email) {
    return;
  }

  try {
    await EmailService.sendOrderCreatedEmail({
      to: customer.email,
      fullName: customer.name,
      orderId: mappedOrder.id,
      details: mappedOrder.details,
      subtotal: mappedOrder.subtotal,
      ivaAmount: mappedOrder.ivaAmount,
      shippingAmount: mappedOrder.shippingAmount,
      total: mappedOrder.total,
      paymentDeadline: mappedOrder.paymentDeadline,
      deliveryType: mappedOrder.deliveryType,
      deliveryAddress: mappedOrder.deliveryAddress,
      deliveryRecipientName: mappedOrder.deliveryRecipientName,
      deliveryDepartment: mappedOrder.deliveryDepartment,
      deliveryCity: mappedOrder.deliveryCity,
    });
  } catch (error) {
    console.error('[CreateOrderUseCase] Email error:', error.message);
  }
};

export const notifyAdminsNewWebOrder = async (order) => {
  const mappedOrder =
    order?.id_order
      ? mapOrder(order)
      : order;

  if (!mappedOrder || mappedOrder.saleType !== 'web') {
    return;
  }

  try {
    const customerName = mappedOrder.customer?.name || 'Un cliente';

    await notifyAdmins({
      title: 'Nuevo pedido web',
      message: `${customerName} realizo el pedido #${mappedOrder.id}.`,
      type: 'order',
      actionUrl: '/admin/sales/orders',
      metadata: {
        module: 'orders',
        idOrder: mappedOrder.id,
        saleType: mappedOrder.saleType,
        event: 'new_web_order',
      },
    });
  } catch (error) {
    console.error(
      '[CreateOrderUseCase] Admin new web order notification error:',
      error.message
    );
  }
};

export class CreateOrderUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async prepare(dto) {
    const client = await this.repo.findClientById(dto.idClient);
    const idEmployee = await resolveAssignedEmployeeId(this.repo, dto);

    if (!client) {
      throw new AppError('Cliente no encontrado.', 404);
    }

    const enrichedItems =
      await getEnrichedOrderItems({
        repo:
          this.repo,
        items:
          dto.items,
        client,
      });

    const calculated = calculateOrderTotals(enrichedItems, {
      shippingAmount: dto.shippingAmount,
    });
    const requestedFavorBalanceAmount = roundMoney(dto.favorBalanceAmount);
    const clientFavorBalance = roundMoney(client.credit_balance);

    assertCanUseFavorBalance({
      amount: requestedFavorBalanceAmount,
      availableBalance: clientFavorBalance,
      maxAmount: calculated.total,
      maxAmountMessage: 'El saldo a favor aplicado no puede superar el total del pedido.',
    });

    const initialPayments = [
      ...(dto.initialPayments || []),
      ...(requestedFavorBalanceAmount > 0
        ? [
            {
              idPaymentMethod: FAVOR_BALANCE_PAYMENT_METHOD_ID,
              amount: requestedFavorBalanceAmount,
              observations: 'Saldo a favor aplicado desde la tienda web.',
              reference: `SALDO-FAVOR-${Date.now()}`,
            },
          ]
        : []),
    ];
    const favorBalanceAmount = getFavorBalancePaymentAmount(initialPayments);

    assertCanUseFavorBalance({
      amount: favorBalanceAmount,
      availableBalance: clientFavorBalance,
      maxAmount: calculated.total,
      maxAmountMessage: 'El saldo a favor aplicado no puede superar el total del pedido.',
    });

    for (const payment of initialPayments) {
      if (Number(payment.idPaymentMethod) === CREDIT_PAYMENT_METHOD_ID) {
        throw new AppError(
          'El metodo Credito solo puede usarse al crear una venta.',
          400
        );
      }

      const paymentMethod = await this.repo.findPaymentMethodById(
        payment.idPaymentMethod
      );

      if (!paymentMethod) {
        throw new AppError(
          `El metodo de pago ${payment.idPaymentMethod} no existe.`,
          404
        );
      }
    }

    const paidAmount = sumPayments(initialPayments);

    if (paidAmount > calculated.total) {
      throw new AppError(
        'La suma de pagos no puede superar el total del pedido.',
        400
      );
    }

    const isPaid = paidAmount >= calculated.total && calculated.total > 0;
    const isPaidWithFavorBalanceOnly =
      isPaid &&
      favorBalanceAmount >= calculated.total &&
      paidAmount === favorBalanceAmount;
    const paymentStatus = isPaid
      ? PAYMENT_STATUSES[2]
      : PAYMENT_STATUSES[1];
    const idOrderStatus = Number(dto.idOrderStatus || IN_PROCESS_ORDER_STATUS_ID);

    if (
      isPaid &&
      !isPaidWithFavorBalanceOnly &&
      !PAID_ORDER_ALLOWED_STATUS_IDS.includes(idOrderStatus)
    ) {
      throw new AppError(
        'Un pedido pagado al registrarse solo puede quedar en estado Listo o Entregado.',
        400
      );
    }

    if (!isPaid && idOrderStatus === DELIVERED_ORDER_STATUS_ID) {
      throw new AppError(
        'Un pedido con pago parcial no puede registrarse como Entregado.',
        400
      );
    }

    if (idOrderStatus === CANCELLED_ORDER_STATUS_ID) {
      throw new AppError(
        'Para cancelar un pedido debe usar la ruta de cancelacion y enviar un motivo.',
        400
      );
    }

    if (
      OPERATIONAL_ORDER_STATUS_IDS.includes(idOrderStatus) &&
      requiresShippingQuote({
        deliveryType: dto.deliveryType,
        saleType: dto.saleType,
        shippingAmount: calculated.shippingAmount,
      })
    ) {
      throw new AppError(
        'Debe registrar el valor del envio antes de avanzar un pedido web a domicilio.',
        400
      );
    }

    return {
      idClient: dto.idClient,
      idEmployee,
      deliveryType: dto.deliveryType,
      deliveryAddress: dto.deliveryAddress,
      deliveryDepartmentCode: dto.deliveryDepartmentCode,
      deliveryDepartmentName: dto.deliveryDepartmentName,
      deliveryCityCode: dto.deliveryCityCode,
      deliveryCityName: dto.deliveryCityName,
      deliveryRecipientName: dto.deliveryRecipientName,
      deliveryRecipientPhone: dto.deliveryRecipientPhone,
      saleType: dto.saleType,
      idOrderStatus,
      idPaymentStatus: paymentStatus.id,
      paymentStatus: paymentStatus.name,
      paymentDeadline: isPaid ? null : dto.paymentDeadline || buildPaymentDeadline(),
      initialPayments,
      favorBalanceAmount,
      isPaidWithFavorBalanceOnly,
      items: calculated.items,
      subtotal: calculated.subtotal,
      ivaAmount: calculated.ivaAmount,
      shippingAmount: calculated.shippingAmount,
      total: calculated.total,
    };
  }

  async createPrepared(orderData) {
    const order = await this.repo.create(orderData);

    return mapOrder(order);
  }

  async createPaidOrderWithDirectSale(orderData) {
    const order = await this.repo.create(orderData);

    try {
      const saleResult = await createVendingUseCase({
        vendingType: orderData.saleType === 'web' ? 'web' : 'direct',
        idEmployee: orderData.idEmployee,
        source: 'paid-order',
        data: {
          idOrder: order.id_order,
          paymentMethods: orderData.initialPayments.map((payment) => ({
            idPaymentMethod: payment.idPaymentMethod,
            amount: payment.amount,
          })),
        },
      });

      if (!saleResult.success) {
        throw new AppError(
          saleResult.error || 'No se pudo generar la venta del pedido pagado.',
          saleResult.errorCode === 'ORDER_ALREADY_SOLD' ? 409 : 400
        );
      }
    } catch (error) {
      await this.repo.deleteCreatedOrder(order.id_order);
      await this.repo.restoreClientFavorBalance(
        orderData.idClient,
        orderData.favorBalanceAmount
      );

      if (
        error.code === 'P2002' ||
        error.message?.includes('venta asociada')
      ) {
        throw new AppError(
          'El pedido ya tiene una venta asociada.',
          409
        );
      }

      if (error.message?.includes('Stock insuficiente')) {
        throw new AppError(
          error.message,
          409
        );
      }

      throw error;
    }

    const orderWithSale = await this.repo.findSummaryById(order.id_order);

    return mapOrder(orderWithSale);
  }

  async execute(dto) {
    const orderData = await this.prepare(dto);

    if (orderData.idPaymentStatus === PAID_PAYMENT_STATUS_ID) {
      return this.createPaidOrderWithDirectSale(orderData);
    }

    return this.createPrepared(orderData);
  }
}

import {
  ORDER_STATUSES,
  PAYMENT_METHOD_IDS,
  PAYMENT_STATUSES,
  SALE_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';
import { createVendingUseCase } from '../../vendings/use-cases/create.usecase.js';
import { VendingRepository } from '../../vendings/repositories/vendingRepository.js';
import { requiresShippingQuote } from '../helpers/orderShippingStatus.js';
import {
  assertCanUseFavorBalance,
  FAVOR_BALANCE_PAYMENT_METHOD_ID,
} from '../../shared/favorBalance.js';

const DEFAULT_VENDING_TYPE = 'manual';
const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHOD_IDS.CREDIT;

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const getVendingTypeFromOrder = (order = {}) =>
  String(order.sale_type || DEFAULT_VENDING_TYPE)
    .trim()
    .toLowerCase();

const validateShippingQuoteBeforePaid = (order = {}) => {
  if (
    requiresShippingQuote({
      deliveryType: order.delivery_type,
      saleType: order.sale_type,
      shippingAmount: order.shipping_amount,
    })
  ) {
    throw new AppError(
      'Debe registrar el valor del envio antes de completar el pago de un pedido web a domicilio.',
      400
    );
  }
};

const getPaidAmountFromOrderPayments = (payments = []) =>
  roundMoney(
    payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    )
  );
const getPaymentMethodsFromOrder = (payments = []) => {
  const grouped = new Map();

  for (const payment of payments) {
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

const generateSaleFromPaidOrder = async (repo, idOrder, options = {}) => {
  const orderWithPayments = await repo.findPaymentStateById(idOrder);
  const paymentMethods = getPaymentMethodsFromOrder(
    orderWithPayments.order_payments
  );

  const saleResult = await createVendingUseCase({
    vendingType: getVendingTypeFromOrder(orderWithPayments),
    idUser: options.idUser,
    idEmployee: options.idEmployee,
    source: 'paid-order',
    data: {
      idOrder: orderWithPayments.id_order,
      idSaleStatus: SALE_STATUSES[1].id,
      paymentMethods,
      // La venta recuperada y el estado Pagado se confirman juntos en la
      // transacción de creación de venta.
      markOrderAsPaid: true,
    },
  });

  if (!saleResult.success) {
    throw new AppError(
      saleResult.error || 'Error generando la venta del pedido pagado.',
      400
    );
  }

  return saleResult.data?.sale || null;
};

const validateSaleFromPaidOrder = async ({
  idOrder,
  paymentMethods,
  saleType,
  options = {},
}) => {
  const saleResult = await createVendingUseCase({
    vendingType: saleType || DEFAULT_VENDING_TYPE,
    idUser: options.idUser,
    idEmployee: options.idEmployee,
    dryRun: true,
    source: 'paid-order',
    data: {
      idOrder,
      idSaleStatus: SALE_STATUSES[1].id,
      paymentMethods,
    },
  });

  if (!saleResult.success) {
    throw new AppError(
      saleResult.error || 'Error validando la venta del pedido pagado.',
      400
    );
  }

  return saleResult.data.saleData;
};

export const notifyPaymentRegistered = async ({
  order,
  paymentMethod,
  amount,
  paidAmount,
  pendingAmount,
  isPaid,
  reference,
}) => {
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
    await EmailService.sendOrderPaymentRegisteredEmail({
      to: customer.email,
      fullName: customer.name,
      orderId: mappedOrder.id,
      paymentMethod: paymentMethod.name_payment_method,
      amount,
      paidAmount,
      pendingAmount,
      isPaid,
      reference,
      shippingAmount: mappedOrder.shippingAmount,
      deliveryType: mappedOrder.deliveryType,
      deliveryAddress: mappedOrder.deliveryAddress,
      deliveryRecipientName: mappedOrder.deliveryRecipientName,
      deliveryDepartment: mappedOrder.deliveryDepartment,
      deliveryCity: mappedOrder.deliveryCity,
    });
  } catch (error) {
    console.error('[NotifyPaymentRegistered] Email error:', error.message);
  }
};

export class RegisterOrderPaymentUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(idOrder, data, options = {}) {
    const order = await this.repo.findPaymentStateById(idOrder);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    // Un pedido cancelado no puede recibir pagos ni abonos.
    if (order.id_order_status === ORDER_STATUSES[4].id) {
      throw new AppError(
        'No se puede registrar pagos a un pedido cancelado.',
        400
      );
    }

    if (order.id_payment_status === PAYMENT_STATUSES[2].id) {
      if (!order.sales) {
        validateShippingQuoteBeforePaid(order);

        const generatedSale = await generateSaleFromPaidOrder(
          this.repo,
          order.id_order,
          options
        );
        const finalOrder = await this.repo.findPaymentResultById(
          order.id_order
        );

        return {
          order: mapOrder(finalOrder),
          paymentSummary: {
            orderTotal: roundMoney(order.total),
            paidBefore: getPaidAmountFromOrderPayments(order.order_payments),
            paidAfter: getPaidAmountFromOrderPayments(order.order_payments),
            pendingBefore: 0,
            pendingAfter: 0,
            isPaid: true,
          },
          generatedSale,
          recoveredSale: true,
        };
      }

      throw new AppError(
        'El pedido ya se encuentra pagado.',
        400
      );
    }

    if (Number(data.idPaymentMethod) === CREDIT_PAYMENT_METHOD_ID) {
      throw new AppError(
        'El metodo Credito solo puede usarse al crear una venta.',
        400
      );
    }

    const paymentMethod = await this.repo.findPaymentMethodById(
      data.idPaymentMethod
    );

    if (!paymentMethod) {
      throw new AppError('Metodo de pago no encontrado.', 404);
    }

    const amount = roundMoney(data.amount);

    if (amount <= 0) {
      throw new AppError(
        'El monto del pago debe ser mayor a cero.',
        400
      );
    }

    const orderTotal = roundMoney(order.total);
    const paidBefore = getPaidAmountFromOrderPayments(
      order.order_payments
    );
    const pendingBefore = roundMoney(orderTotal - paidBefore);

    if (pendingBefore <= 0) {
      if (!order.sales) {
        validateShippingQuoteBeforePaid(order);

        const generatedSale = await generateSaleFromPaidOrder(
          this.repo,
          order.id_order,
          options
        );

        const finalOrder = await this.repo.findPaymentResultById(
          order.id_order
        );

        return {
          order: mapOrder(finalOrder),
          paymentSummary: {
            orderTotal,
            paidBefore,
            paidAfter: paidBefore,
            pendingBefore,
            pendingAfter: 0,
            isPaid: true,
          },
          generatedSale,
          recoveredSale: true,
        };
      }

      throw new AppError(
        'El pedido no tiene saldo pendiente.',
        400
      );
    }

    if (amount > pendingBefore) {
      throw new AppError(
        `El pago supera el saldo pendiente. Saldo pendiente: ${pendingBefore}.`,
        400
      );
    }

    if (Number(data.idPaymentMethod) === FAVOR_BALANCE_PAYMENT_METHOD_ID) {
      assertCanUseFavorBalance({
        amount,
        availableBalance: order.clients?.credit_balance,
        maxAmount: pendingBefore,
        maxAmountMessage: 'El saldo a favor aplicado no puede superar el saldo pendiente del pedido.',
      });
    }

    const paidAfter = roundMoney(
      paidBefore + amount
    );
    const pendingAfter = roundMoney(orderTotal - paidAfter);
    const isPaid = pendingAfter <= 0;

    let saleData = null;

    if (isPaid && !order.sales) {
      validateShippingQuoteBeforePaid(order);

      saleData = await validateSaleFromPaidOrder({
        idOrder: order.id_order,
        saleType: getVendingTypeFromOrder(order),
        paymentMethods: getPaymentMethodsFromOrder([
          ...order.order_payments,
          {
            id_payment_method: data.idPaymentMethod,
            amount,
          },
        ]),
        options,
      });
    }

    let generatedSale = null;

    if (isPaid && !order.sales) {
      generatedSale = await VendingRepository.completeOrderPaymentAndCreateSale({
        saleData,
        payment: {
          ...data,
          amount,
          idClient: order.id_customer,
        },
        receiptReview: options.receiptReview || null,
      });
    } else {
      await this.repo.registerPartialPayment(order.id_order, {
        ...data,
        amount,
        idClient: order.id_customer,
      });
    }

    const finalOrder = await this.repo.findPaymentResultById(
      order.id_order
    );

    const mappedOrder = mapOrder(finalOrder);

    return {
      order: mappedOrder,
      paymentSummary: {
        orderTotal,
        paidBefore,
        paidAfter,
        pendingBefore,
        pendingAfter: Math.max(pendingAfter, 0),
        isPaid,
      },
      generatedSale,
      paymentNotification: {
        order: mappedOrder,
        paymentMethod,
        amount,
        paidAmount: paidAfter,
        pendingAmount: Math.max(pendingAfter, 0),
        isPaid,
        reference: data.reference,
      },
    };
  }
}

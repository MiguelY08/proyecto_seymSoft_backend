import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  SALE_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';
import { createVendingUseCase } from '../../vendings/use-cases/create.usecase.js';

const DEFAULT_VENDING_TYPE = 'manual';
const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

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
    vendingType: DEFAULT_VENDING_TYPE,
    idUser: options.idUser,
    idEmployee: options.idEmployee,
    data: {
      idOrder: orderWithPayments.id_order,
      idSaleStatus: SALE_STATUSES[1].id,
      paymentMethods,
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
  options = {},
}) => {
  const saleResult = await createVendingUseCase({
    vendingType: DEFAULT_VENDING_TYPE,
    idUser: options.idUser,
    idEmployee: options.idEmployee,
    dryRun: true,
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
        const generatedSale = await generateSaleFromPaidOrder(
          this.repo,
          order.id_order,
          options
        );

        await this.repo.updatePaymentStatus(
          order.id_order,
          PAYMENT_STATUSES[2].id
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

    const paidAfter = roundMoney(
      paidBefore + amount
    );
    const pendingAfter = roundMoney(orderTotal - paidAfter);
    const isPaid = pendingAfter <= 0;

    if (isPaid && !order.sales) {
      await validateSaleFromPaidOrder({
        idOrder: order.id_order,
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

    await this.repo.createPayment(order.id_order, {
      ...data,
      amount,
    });

    let generatedSale = null;

    // Al completar el pago, primero se genera la venta y luego se marca el pedido como Pagado.
    if (isPaid && !order.sales) {
      generatedSale = await generateSaleFromPaidOrder(
        this.repo,
        order.id_order,
        options
      );
    }

    await this.repo.updatePaymentStatus(
      order.id_order,
      isPaid
        ? PAYMENT_STATUSES[2].id
        : PAYMENT_STATUSES[1].id
    );

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

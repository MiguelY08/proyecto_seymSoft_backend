import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SALE_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { mapOrder } from '../mappers/orderMapper.js';
import { createVendingUseCase } from '../../vendings/use-cases/create.usecase.js';

const DEFAULT_VENDING_TYPE = 'web';

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

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

export class RegisterOrderPaymentUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(idOrder, data) {
    const order = await this.repo.findById(idOrder);

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
      throw new AppError(
        'El pedido ya se encuentra pagado.',
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
    const paidBefore = roundMoney(
      await this.repo.sumPaymentsByOrderId(order.id_order)
    );
    const pendingBefore = roundMoney(orderTotal - paidBefore);

    if (pendingBefore <= 0) {
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

    await this.repo.createPayment(order.id_order, {
      ...data,
      amount,
    });

    const paidAfter = roundMoney(
      await this.repo.sumPaymentsByOrderId(order.id_order)
    );
    const pendingAfter = roundMoney(orderTotal - paidAfter);
    const isPaid = pendingAfter <= 0;

    const updatedOrder = await this.repo.updatePaymentStatus(
      order.id_order,
      isPaid
        ? PAYMENT_STATUSES[2].id
        : PAYMENT_STATUSES[1].id
    );

    let generatedSale = null;

    // Al completar el pago, el pedido debe convertirse automaticamente en venta.
    if (isPaid && !updatedOrder.sales) {
      const paymentMethods = getPaymentMethodsFromOrder(
        updatedOrder.order_payments
      );

      const saleResult = await createVendingUseCase({
        vendingType: DEFAULT_VENDING_TYPE,
        data: {
          idOrder: updatedOrder.id_order,
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

      generatedSale = saleResult.data?.sale || null;
    }

    const finalOrder = await this.repo.findById(order.id_order);

    return {
      order: mapOrder(finalOrder),
      paymentSummary: {
        orderTotal,
        paidBefore,
        paidAfter,
        pendingBefore,
        pendingAfter: Math.max(pendingAfter, 0),
        isPaid,
      },
      generatedSale,
    };
  }
}

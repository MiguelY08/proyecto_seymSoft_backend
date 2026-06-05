import {
  ORDER_PAYMENT_EXPIRATION,
} from '../../../../shared/constants/generalStatuses.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const getCustomerEmail = (order) =>
  order.clients?.users?.email || null;

const getCustomerName = (order) =>
  order.clients?.users?.full_name || null;

const getPaidAmount = (order) =>
  roundMoney(
    (order.order_payments || []).reduce(
      (acc, payment) => acc + Number(payment.amount || 0),
      0
    )
  );

const getPendingAmount = (order) =>
  Math.max(roundMoney(Number(order.total || 0) - getPaidAmount(order)), 0);

const getHoursUntilDeadline = (order, now) => {
  if (!order.payment_deadline) {
    return null;
  }

  const diffMs = new Date(order.payment_deadline).getTime() - new Date(now).getTime();
  return Math.max(Math.ceil(diffMs / (60 * 60 * 1000)), 0);
};

export class ProcessPendingOrderPaymentsUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(now = new Date()) {
    const currentDate = new Date(now);
    const reminderOrders = await this.repo.findPendingOrdersForPaymentReminders(
      currentDate
    );
    const expiredOrders = await this.repo.findExpiredPendingOrders(
      currentDate
    );

    const reminders = [];
    const expirations = [];
    const errors = [];

    for (const order of reminderOrders) {
      try {
        const hoursRemaining = getHoursUntilDeadline(order, currentDate);

        if (!hoursRemaining) {
          continue;
        }

        const shouldSend1h =
          hoursRemaining <= ORDER_PAYMENT_EXPIRATION.REMINDER_1H &&
          !order.payment_reminder_1h_sent;
        const shouldSend6h =
          hoursRemaining <= ORDER_PAYMENT_EXPIRATION.REMINDER_6H &&
          !order.payment_reminder_6h_sent;

        if (!shouldSend1h && !shouldSend6h) {
          continue;
        }

        const to = getCustomerEmail(order);

        if (!to) {
          errors.push({
            idOrder: order.id_order,
            error: 'El cliente no tiene correo electronico registrado.',
          });
          continue;
        }

        await EmailService.sendOrderPaymentReminderEmail({
          to,
          fullName: getCustomerName(order),
          orderId: order.id_order,
          orderTotal: roundMoney(order.total),
          paidAmount: getPaidAmount(order),
          pendingAmount: getPendingAmount(order),
          paymentDeadline: order.payment_deadline,
          hoursRemaining: shouldSend1h
            ? ORDER_PAYMENT_EXPIRATION.REMINDER_1H
            : ORDER_PAYMENT_EXPIRATION.REMINDER_6H,
        });

        const updatedOrder = shouldSend1h
          ? await this.repo.markPaymentReminder1hSent(order.id_order)
          : await this.repo.markPaymentReminder6hSent(order.id_order);

        reminders.push({
          idOrder: order.id_order,
          type: shouldSend1h ? '1h' : '6h',
          order: mapOrder(updatedOrder),
        });
      } catch (error) {
        errors.push({
          idOrder: order.id_order,
          error: error.message,
        });
      }
    }

    for (const order of expiredOrders) {
      try {
        const expiredOrder = await this.repo.expirePendingOrder(
          order.id_order,
          'Pedido cancelado automaticamente por vencimiento de pago.'
        );

        expirations.push({
          idOrder: order.id_order,
          order: mapOrder(expiredOrder),
        });
      } catch (error) {
        errors.push({
          idOrder: order.id_order,
          error: error.message,
        });
      }
    }

    return {
      processedAt: currentDate,
      remindersSent: reminders.length,
      expiredOrders: expirations.length,
      reminders,
      expirations,
      errors,
    };
  }
}

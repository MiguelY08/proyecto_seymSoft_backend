import { notificationService } from '../../../notifications/services/index.js';

const getOrderId = (order) =>
  order?.id_order ?? order?.id ?? order?.orderNumber ?? null;

const getCustomerUserId = (order) =>
  order?.clients?.users?.id_user ??
  order?.customer?.idUser ??
  order?.customer?.id_user ??
  order?.customerUserId ??
  null;

const createOrderActionUrl = (order) => {
  const orderId = getOrderId(order);
  return orderId ? `/orders-l/${orderId}` : '/orders-l';
};

export const notifyCustomerOrderUpdated = async ({ order }) => {
  const idUser = getCustomerUserId(order);
  const orderId = getOrderId(order);

  if (!idUser || !orderId) {
    return null;
  }

  try {
    return await notificationService.create({
      idUser,
      title: 'Pedido actualizado',
      message: `Tu pedido #${orderId} fue actualizado. Revisa los cambios desde el detalle del pedido.`,
      type: 'order',
      actionUrl: createOrderActionUrl(order),
      metadata: {
        orderId,
        event: 'order_updated',
      },
    });
  } catch (error) {
    console.error('[OrderCustomerNotifications] Order update notification error:', error.message);
    return null;
  }
};

export const notifyCustomerPaymentReceiptReviewed = async ({
  order,
  receipt,
  paymentSummary,
}) => {
  const idUser = getCustomerUserId(order);
  const orderId = getOrderId(order);

  if (!idUser || !orderId || !receipt?.status) {
    return null;
  }

  const approved = receipt.status === 'Aprobado';
  const title = approved
    ? 'Pago aprobado'
    : 'Comprobante rechazado';
  const message = approved
    ? `Tu pago del pedido #${orderId} fue aprobado.`
    : `Tu comprobante del pedido #${orderId} fue rechazado.${receipt.reviewObservations ? ` Motivo: ${receipt.reviewObservations}` : ''}`;

  try {
    return await notificationService.create({
      idUser,
      title,
      message,
      type: approved ? 'payment' : 'warning',
      actionUrl: createOrderActionUrl(order),
      metadata: {
        orderId,
        receiptId: receipt.id,
        receiptStatus: receipt.status,
        paidAmount: paymentSummary?.paidAfter ?? null,
        pendingAmount: paymentSummary?.pendingAfter ?? null,
        event: approved
          ? 'payment_receipt_approved'
          : 'payment_receipt_rejected',
      },
    });
  } catch (error) {
    console.error('[OrderCustomerNotifications] Receipt review notification error:', error.message);
    return null;
  }
};

export const notifyCustomerOrderExpired = async ({ order, reason }) => {
  const idUser = getCustomerUserId(order);
  const orderId = getOrderId(order);

  if (!idUser || !orderId) {
    return null;
  }

  try {
    return await notificationService.create({
      idUser,
      title: 'Plazo de pago expirado',
      message: `El plazo para pagar tu pedido #${orderId} expiró.${reason ? ` ${reason}` : ''}`,
      type: 'warning',
      actionUrl: createOrderActionUrl(order),
      metadata: {
        orderId,
        event: 'order_payment_expired',
      },
    });
  } catch (error) {
    console.error('[OrderCustomerNotifications] Order expiration notification error:', error.message);
    return null;
  }
};


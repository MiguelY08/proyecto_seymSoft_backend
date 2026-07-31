import { notificationService } from '../../../notifications/services/index.js';
import { ORDER_STATUSES } from '../../../../shared/constants/generalStatuses.js';
import { DELIVERY_TYPES } from '../../shared/deliveryTypes.js';

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

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isReadyStatus = (order) => {
  const statusId =
    Number(
      order?.id_order_status ??
      order?.status?.id ??
      order?.statusId
    );
  const statusName =
    order?.order_statuses?.name_status ??
    order?.status?.name ??
    order?.statusName;

  return (
    statusId === ORDER_STATUSES[2].id ||
    normalizeText(statusName) === normalizeText(ORDER_STATUSES[2].name)
  );
};

const isPickupOrder = (order) => {
  const deliveryType =
    order?.delivery_type ??
    order?.deliveryType;

  return normalizeText(deliveryType) === normalizeText(DELIVERY_TYPES.PICKUP);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const notifyCustomerShippingAmountAssigned = async ({ order }) => {
  const idUser = getCustomerUserId(order);
  const orderId = getOrderId(order);
  const shippingAmount = Number(
    order?.shipping_amount ?? order?.shippingAmount ?? 0
  );
  const total = Number(order?.total ?? 0);

  if (!idUser || !orderId || shippingAmount <= 0) {
    return null;
  }

  try {
    return await notificationService.create({
      idUser,
      title: 'Valor de envio asignado',
      message: `El envio de tu pedido #${orderId} fue asignado por ${formatCurrency(shippingAmount)}. El total a transferir es ${formatCurrency(total)}; ya puedes enviar un unico comprobante.`,
      type: 'payment',
      actionUrl: createOrderActionUrl(order),
      metadata: {
        orderId,
        shippingAmount,
        total,
        event: 'order_shipping_amount_assigned',
      },
    });
  } catch (error) {
    console.error('[OrderCustomerNotifications] Shipping assignment notification error:', error.message);
    return null;
  }
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

export const notifyCustomerOrderReadyForPickup = async ({ order }) => {
  const idUser = getCustomerUserId(order);
  const orderId = getOrderId(order);

  if (!idUser || !orderId || !isReadyStatus(order) || !isPickupOrder(order)) {
    return null;
  }

  try {
    return await notificationService.create({
      idUser,
      title: 'Pedido listo para recoger',
      message: `Tu pedido #${orderId} esta listo para recoger.`,
      type: 'order',
      actionUrl: createOrderActionUrl(order),
      metadata: {
        orderId,
        event: 'order_ready_for_pickup',
      },
    });
  } catch (error) {
    console.error('[OrderCustomerNotifications] Ready for pickup notification error:', error.message);
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

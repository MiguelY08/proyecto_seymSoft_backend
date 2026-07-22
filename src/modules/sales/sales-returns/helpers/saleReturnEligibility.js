export const MAX_SALE_RETURN_DAYS = 30;
const DELIVERED_ORDER_STATUS_ID = 3;

const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const startOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const evaluateSaleReturnEligibility = (sale) => {
  const order = sale?.sales_orders;
  const orderStatusName = order?.order_statuses?.name_status || '';
  const isDelivered =
    Number(order?.id_order_status) === DELIVERED_ORDER_STATUS_ID ||
    normalize(orderStatusName) === 'entregado';

  if (!isDelivered) {
    return {
      canReturn: false,
      reason: 'La factura todavía no tiene el pedido en estado Entregado',
      deliveredAt: null,
      daysSinceDelivery: null,
      remainingDays: null,
    };
  }

  // HEV es el único registro de fecha de cambio disponible actualmente.
  // Las ventas directas pueden nacer entregadas sin HEV, por eso sale_date
  // funciona como respaldo en ese caso.
  const deliveredAt = startOfDay(order?.hev?.status_date || sale?.sale_date);
  if (!deliveredAt) {
    return {
      canReturn: false,
      reason: 'No se encontró la fecha en que la venta fue entregada',
      deliveredAt: null,
      daysSinceDelivery: null,
      remainingDays: null,
    };
  }

  const today = startOfDay(new Date());
  const daysSinceDelivery = Math.max(
    0,
    Math.floor((today.getTime() - deliveredAt.getTime()) / 86400000),
  );
  const canReturn = daysSinceDelivery <= MAX_SALE_RETURN_DAYS;

  return {
    canReturn,
    reason: canReturn
      ? `Dentro del plazo de devolución (${daysSinceDelivery}/${MAX_SALE_RETURN_DAYS} días)`
      : `El plazo de ${MAX_SALE_RETURN_DAYS} días desde la entrega ya venció`,
    deliveredAt,
    daysSinceDelivery,
    remainingDays: Math.max(0, MAX_SALE_RETURN_DAYS - daysSinceDelivery),
  };
};

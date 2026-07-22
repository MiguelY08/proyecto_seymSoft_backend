import { DELIVERY_TYPES } from '../../shared/deliveryTypes.js';

export const SHIPPING_STATUSES = {
  NOT_APPLICABLE: 'No aplica',
  PENDING: 'Pendiente',
  ASSIGNED: 'Asignado',
};

const normalizeSaleType = (saleType) =>
  String(saleType || 'manual').trim().toLowerCase();

const normalizeShippingAmount = (shippingAmount) =>
  Number(shippingAmount || 0);

export const getShippingStatus = ({
  deliveryType,
  shippingAmount,
}) => {
  if (deliveryType !== DELIVERY_TYPES.DELIVERY) {
    return SHIPPING_STATUSES.NOT_APPLICABLE;
  }

  return normalizeShippingAmount(shippingAmount) > 0
    ? SHIPPING_STATUSES.ASSIGNED
    : SHIPPING_STATUSES.PENDING;
};

export const requiresShippingQuote = ({
  deliveryType,
  saleType,
  shippingAmount,
}) =>
  normalizeSaleType(saleType) === 'web' &&
  deliveryType === DELIVERY_TYPES.DELIVERY &&
  normalizeShippingAmount(shippingAmount) <= 0;


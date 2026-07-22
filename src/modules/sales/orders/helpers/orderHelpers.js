import { CLIENT_TYPES } from '../../../../shared/constants/generalStatuses.js';

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeClientType = (clientType) =>
  String(clientType || CLIENT_TYPES.RETAIL)
    .trim()
    .toLowerCase();

export const normalizeClientTypeForPricing = (clientType) => {
  const normalizedType = normalizeClientType(clientType);

  if (normalizedType.includes('mayor')) {
    return CLIENT_TYPES.WHOLESALE;
  }

  if (normalizedType.includes('colega') || normalizedType.includes('partner')) {
    return CLIENT_TYPES.PARTNER;
  }

  if (normalizedType.includes('paca') || normalizedType.includes('bulk')) {
    return CLIENT_TYPES.BULK;
  }

  return CLIENT_TYPES.RETAIL;
};

// Seleccionar el precio final del producto segun el tipo de cliente.
// Los precios registrados en productos ya incluyen IVA.
export const getPriceByClientType = (product, clientType) => {
  const normalizedType = normalizeClientTypeForPricing(clientType);

  switch (normalizedType) {
    case CLIENT_TYPES.WHOLESALE:
      return product.wholesale_price;

    case CLIENT_TYPES.PARTNER:
    case CLIENT_TYPES.PARTNERS:
      return product.partner_price;

    case CLIENT_TYPES.BULK:
    case CLIENT_TYPES.BULKS:
      return product.bulk_price;

    case CLIENT_TYPES.RETAIL:
    default:
      return product.retail_price;
  }
};

const splitIncludedIva = ({ totalWithIva, ivaPercentage }) => {
  const total = roundMoney(totalWithIva);
  const percentage = Number(ivaPercentage) || 0;

  if (percentage <= 0) {
    return {
      subtotal: total,
      ivaAmount: 0,
      total,
    };
  }

  const subtotal = roundMoney(total / (1 + percentage / 100));
  const ivaAmount = roundMoney(total - subtotal);

  return {
    subtotal,
    ivaAmount,
    total,
  };
};

// Calcular totales monetarios del pedido con precios que ya incluyen IVA.
export const calculateOrderTotals = (items = [], options = {}) => {
  const shippingAmount = roundMoney(options.shippingAmount);
  const calculatedItems = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const ivaPercentage = Number(item.ivaPercentage) || 0;
    const lineTotal = roundMoney(quantity * unitPrice);
    const taxBreakdown = splitIncludedIva({
      totalWithIva: lineTotal,
      ivaPercentage,
    });

    return {
      ...item,
      quantity,
      unitPrice,
      ivaPercentage,
      subtotal: taxBreakdown.subtotal,
      ivaAmount: taxBreakdown.ivaAmount,
      total: taxBreakdown.total,
    };
  });

  const subtotal = roundMoney(
    calculatedItems.reduce(
      (acc, item) => acc + item.subtotal,
      0
    )
  );

  const ivaAmount = roundMoney(
    calculatedItems.reduce(
      (acc, item) => acc + item.ivaAmount,
      0
    )
  );

  const productTotal = roundMoney(
    calculatedItems.reduce(
      (acc, item) => acc + item.total,
      0
    )
  );
  const total = roundMoney(productTotal + shippingAmount);

  return {
    items: calculatedItems,
    subtotal,
    ivaAmount,
    shippingAmount,
    total,
  };
};

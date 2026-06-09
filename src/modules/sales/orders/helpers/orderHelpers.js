import { CLIENT_TYPES } from '../../../../shared/constants/generalStatuses.js';

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeClientType = (clientType) =>
  String(clientType || CLIENT_TYPES.RETAIL)
    .trim()
    .toLowerCase();

// Seleccionar el precio del producto segun el tipo de cliente.
export const getPriceByClientType = (product, clientType) => {
  const normalizedType = normalizeClientType(clientType);

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

// Calcular totales monetarios del pedido con precision de dos decimales.
export const calculateOrderTotals = (items = []) => {
  const calculatedItems = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const ivaPercentage = Number(item.ivaPercentage) || 0;

    const subtotal = roundMoney(quantity * unitPrice);
    const ivaAmount = roundMoney(subtotal * (ivaPercentage / 100));

    return {
      ...item,
      quantity,
      unitPrice,
      ivaPercentage,
      subtotal,
      ivaAmount,
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

  const total = roundMoney(subtotal + ivaAmount);

  return {
    items: calculatedItems,
    subtotal,
    ivaAmount,
    total,
  };
};

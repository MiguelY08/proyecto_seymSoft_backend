export const calculateOrderTotals = (items = []) => {
  const calculatedItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const ivaPercentage = Number(item.ivaPercentage || 0);

    const subtotal = quantity * unitPrice;
    const ivaAmount = subtotal * (ivaPercentage / 100);

    return {
      ...item,
      quantity,
      unitPrice,
      ivaPercentage,
      subtotal,
      ivaAmount,
    };
  });

  const subtotal = calculatedItems.reduce(
    (acc, item) => acc + item.subtotal,
    0
  );

  const ivaAmount = calculatedItems.reduce(
    (acc, item) => acc + item.ivaAmount,
    0
  );

  const total = subtotal + ivaAmount;

  return {
    items: calculatedItems,
    subtotal,
    ivaAmount,
    total,
  };

  export const getPriceByClientType = (product, clientType) => {
  switch (clientType) {
    case 'Mayorista':
      return product.wholesale_price;

    case 'Colega':
      return product.partner_price;

    case 'Paca':
      return product.bulk_price;

    case 'Detal':
    default:
      return product.retail_price;
  }
};
};
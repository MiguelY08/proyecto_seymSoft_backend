const toPrice = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getMissingSalePrices = (product = {}) => {
  const prices = [
    ['precio detal', product.retailPrice ?? product.retail_price ?? product.precioDetalle],
    ['precio mayorista', product.wholesalePrice ?? product.wholesale_price ?? product.precioMayorista],
    ['precio colegas', product.partnerPrice ?? product.partner_price ?? product.precioColegas],
    ['precio por pacas', product.bulkPrice ?? product.bulk_price ?? product.precioPacas],
  ];

  return prices.filter(([, value]) => toPrice(value) <= 0).map(([label]) => label);
};

export const hasCompleteSalePrices = (product = {}) =>
  getMissingSalePrices(product).length === 0;

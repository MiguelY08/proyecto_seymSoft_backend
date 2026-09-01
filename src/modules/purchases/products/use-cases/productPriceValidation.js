import { AppError } from "../../../../shared/errors/appError.js";

const optionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const validateProductPrices = (prices = {}) => {
  const supplier = optionalNumber(prices.supplierPrice ?? prices.precio_proveedor);
  const salePrices = [
    ['Precio detal', optionalNumber(prices.retailPrice ?? prices.retail_price)],
    ['Precio mayorista', optionalNumber(prices.wholesalePrice ?? prices.wholesale_price)],
    ['Precio colegas', optionalNumber(prices.partnerPrice ?? prices.partner_price)],
    ['Precio X pacas', optionalNumber(prices.bulkPrice ?? prices.bulk_price)],
  ];

  if (supplier !== null) {
    const withoutProfit = salePrices.find(([, value]) => value !== null && value > 0 && value <= supplier);
    if (withoutProfit) {
      throw new AppError(`${withoutProfit[0]} debe ser mayor al precio de compra al proveedor.`, 400);
    }
  }

  const partner = salePrices[2][1];
  const bulk = salePrices[3][1];
  const retail = salePrices[0][1];
  const wholesale = salePrices[1][1];

  if (retail > 0 && wholesale > 0 && wholesale >= retail) {
    throw new AppError('Precio mayorista debe ser menor al precio detal.', 400);
  }
  if (wholesale > 0 && partner > 0 && partner > wholesale) {
    throw new AppError('Precio colegas debe ser menor o igual al precio mayorista.', 400);
  }
  if (partner > 0 && bulk > 0 && bulk > partner) {
    throw new AppError('Precio X pacas debe ser menor o igual al precio colegas.', 400);
  }
};

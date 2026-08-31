import { AppError } from "../../../../shared/errors/appError.js";

const PERCENTAGE_FIELDS = [
  ['IVA', 'ivaPercentage', 'iva_percentage'],
  ['Descuento detal', 'retailDiscountPct', 'retail_discount_pct'],
  ['Descuento mayorista', 'wholesaleDiscountPct', 'wholesale_discount_pct'],
  ['Descuento colegas', 'partnerDiscountPct', 'partner_discount_pct'],
  ['Descuento X pacas', 'bulkDiscountPct', 'bulk_discount_pct'],
];

export const validateProductPercentages = (product = {}) => {
  for (const [label, camelField, databaseField] of PERCENTAGE_FIELDS) {
    const rawValue = product[camelField] ?? product[databaseField];
    if (rawValue === undefined || rawValue === null || rawValue === '') continue;

    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new AppError(`${label} debe estar entre 0 y 100%.`, 400);
    }
  }
};

import { PAYMENT_BUSINESS_RULES } from "../constants/paymentBusinessRules.constants.js";

/**
 * Determina si un abono puede anularse.
 *
 * Regla:
 * máximo 48 horas desde su creación.
 */
export default function calculateCanCancelInstallment({
  createdAt,
}) {
  const createdDate = new Date(createdAt);

  const hoursDifference =
    (Date.now() - createdDate.getTime()) /
    (1000 * 60 * 60);

  return (
    hoursDifference <=
    PAYMENT_BUSINESS_RULES.INSTALLMENT_CANCELLATION_HOURS
  );
}
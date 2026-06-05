/**
 * Calcula el capital pendiente de un crédito.
 *
 * Fórmula:
 * capital original - capital pagado
 */
export default function calculatePendingCapital({
  originalCapital,
  totalPaidCapital
}) {
  const pendingCapital =
    originalCapital - totalPaidCapital;

  return Math.max(0, pendingCapital);
}
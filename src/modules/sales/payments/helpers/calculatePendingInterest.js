/**
 * Calcula el interés pendiente de un crédito.
 *
 * Fórmula:
 * intereses generados - intereses pagados
 */
export default function calculatePendingInterest({
  totalGeneratedInterest,
  totalPaidInterest
}) {
  const pendingInterest =
    totalGeneratedInterest - totalPaidInterest;

  return Math.max(0, pendingInterest);
}
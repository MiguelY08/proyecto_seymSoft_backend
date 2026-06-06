/**
 * Calcula la deuda total de un crédito.
 *
 * Fórmula:
 * capital pendiente + interés pendiente
 */
export default function calculateTotalDebt({
  pendingCapital,
  pendingInterest
}) {
  return pendingCapital + pendingInterest;
}
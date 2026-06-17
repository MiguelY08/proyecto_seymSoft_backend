/**
 * Calcula la deuda total del crédito.
 *
 * Fórmula:
 * capital pendiente + interés pendiente
 */
export default function calculateTotalDebt({
  pendingCapital,
  pendingInterest,
}) {
  return (
    Number(pendingCapital) +
    Number(pendingInterest)
  );
}
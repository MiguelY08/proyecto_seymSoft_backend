/**
 * Calcula el valor monetario de un interés.
 *
 * Fórmula:
 * capital pendiente * porcentaje / 100
 */
export default function calculateInterestAmount({
  pendingCapital,
  percentage
}) {
  const generatedAmount =
    (pendingCapital * percentage) / 100;

  return Number(
    generatedAmount.toFixed(2)
  );
}
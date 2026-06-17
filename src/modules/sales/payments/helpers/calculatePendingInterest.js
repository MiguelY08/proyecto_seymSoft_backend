/**
 * Calcula el interés pendiente.
 *
 * Fórmula:
 * intereses generados - intereses pagados
 */
export default function calculatePendingInterest({
  generatedInterest,
  paidInterest,
}) {
  const pendingInterest =
    Number(generatedInterest) -
    Number(paidInterest);

  return Math.max(0, pendingInterest);
}
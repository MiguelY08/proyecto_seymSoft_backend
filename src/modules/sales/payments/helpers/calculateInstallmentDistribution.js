/**
 * Distribuye un abono entre intereses y capital.
 *
 * Regla:
 * 1. Se pagan primero los intereses.
 * 2. El excedente se aplica al capital.
 */
export default function calculateInstallmentDistribution({
  amount,
  pendingInterest,
  pendingCapital
}) {
  let remainingAmount = amount;

  const interestPaid = Math.min(
    remainingAmount,
    pendingInterest
  );

  remainingAmount -= interestPaid;

  const capitalPaid = Math.min(
    remainingAmount,
    pendingCapital
  );

  remainingAmount -= capitalPaid;

  return {
    interestPaid,
    capitalPaid,
    remainingAmount
  };
}
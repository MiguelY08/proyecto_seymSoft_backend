/**
 * Distribuye un abono entre intereses y capital.
 *
 * Regla:
 * 1. Primero se pagan intereses.
 * 2. Luego se paga capital.
 */
export default function calculateInstallmentDistribution({
  installmentAmount,
  pendingInterest,
  pendingCapital,
}) {
  let remainingAmount = Number(installmentAmount);

  const interestPaid = Math.min(
    remainingAmount,
    Number(pendingInterest)
  );

  remainingAmount -= interestPaid;

  const capitalPaid = Math.min(
    remainingAmount,
    Number(pendingCapital)
  );

  return {
    interestPaid,
    capitalPaid,
  };
}
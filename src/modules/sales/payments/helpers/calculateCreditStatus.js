/**
 * Determina el estado del crédito.
 */
export default function calculateCreditStatus({
  remainingBalance,
  dueDate,
  pendingStatus,
  paidStatus,
  overdueStatus,
  currentDate = new Date(),
}) {
  if (Number(remainingBalance) <= 0) {
    return paidStatus;
  }

  if (currentDate > new Date(dueDate)) {
    return overdueStatus;
  }

  return pendingStatus;
}
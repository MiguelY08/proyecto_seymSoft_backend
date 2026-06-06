/**
 * Determina el estado actual de un crédito.
 *
 * Estados:
 * AL_DIA
 * PENDIENTE
 * VENCIDO
 */
export default function calculateCustomerStatus({
  totalDebt,
  dueDate,
  currentDate = new Date()
}) {
  if (totalDebt <= 0) {
    return 'AL_DIA';
  }

  if (currentDate > new Date(dueDate)) {
    return 'VENCIDO';
  }

  return 'PENDIENTE';
}
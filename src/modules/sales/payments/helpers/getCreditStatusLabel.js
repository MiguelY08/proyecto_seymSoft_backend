import { CREDIT_STATUS } from "../constants/creditStatus.constants.js";

/**
 * Convierte el id del estado en una etiqueta legible.
 */
export default function getCreditStatusLabel({
  statusId,
  statuses,
}) {
  if (statusId === statuses.pending) {
    return CREDIT_STATUS.PENDING;
  }

  if (statusId === statuses.paid) {
    return CREDIT_STATUS.PAID;
  }

  if (statusId === statuses.overdue) {
    return CREDIT_STATUS.OVERDUE;
  }

  return null;
}
import { PAYMENT_BUSINESS_RULES } from "../constants/paymentBusinessRules.constants.js";

/**
 * Intenta normalizar distintos formatos de fecha a un objeto Date.
 * Acepta:
 * - Instancias de Date
 * - Timestamps numéricos
 * - Cadenas ISO (YYYY-MM-DD...)
 * - Cadenas en formato colombiano: DD/MM/YYYY o DD/MM/YYYY HH:mm[:ss]
 */
function parseToDate(value) {
  if (!value && value !== 0) return null;

  // Date instance
  if (value instanceof Date) {
    return value;
  }

  // Numeric timestamp
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    // ISO-like -> rely on Date parser
    const isoMatch = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
    if (isoMatch) {
      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime())) return d;
    }

    // Colombian format: DD/MM/YYYY[ HH:mm[:ss]]
    const colMatch = /^\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/.test(
      trimmed,
    );
    if (colMatch) {
      const [datePart, timePart] = trimmed.split(/\s+/);
      const [day, month, year] = datePart
        .split("/")
        .map((v) => parseInt(v, 10));
      let hour = 0,
        minute = 0,
        second = 0;
      if (timePart) {
        const parts = timePart.split(":").map((v) => parseInt(v, 10));
        hour = parts[0] || 0;
        minute = parts[1] || 0;
        second = parts[2] || 0;
      }

      // Construct using local timezone - acceptable for cancellation window checks
      const d = new Date(year, month - 1, day, hour, minute, second);
      if (!Number.isNaN(d.getTime())) return d;
    }

    // Fallback: try Date parser once more
    const d2 = new Date(trimmed);
    if (!Number.isNaN(d2.getTime())) return d2;
  }

  return null;
}

/**
 * Determina si un abono puede anularse.
 * Regla: máximo 48 horas desde su creación.
 */
export default function calculateCanCancelInstallment({ createdAt }) {
  const createdDate = parseToDate(createdAt);

  if (!createdDate) return false;

  const hoursDifference =
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);

  return (
    hoursDifference <= PAYMENT_BUSINESS_RULES.INSTALLMENT_CANCELLATION_HOURS
  );
}

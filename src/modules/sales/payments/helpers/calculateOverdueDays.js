/**
 * Calcula los días de mora.
 *
 * Si no está vencido retorna 0.
 */
export default function calculateOverdueDays({
  dueDate,
  currentDate = new Date(),
}) {
  const dueDateValue = new Date(dueDate);

  if (currentDate <= dueDateValue) {
    return 0;
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return Math.floor(
    (currentDate - dueDateValue) /
      millisecondsPerDay
  );
}
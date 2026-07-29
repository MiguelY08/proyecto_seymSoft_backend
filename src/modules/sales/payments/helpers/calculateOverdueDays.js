/**
 * Calcula los días de mora.
 *
 * Si no está vencido retorna 0.
 */
export default function calculateOverdueDays({
  dueDate,
  currentDate = new Date(),
}) {
  if (!dueDate) {
    return 0;
  }

  const dueDateValue = new Date(dueDate);
  dueDateValue.setHours(0, 0, 0, 0);

  const currentDateValue = new Date(currentDate);
  currentDateValue.setHours(0, 0, 0, 0);

  if (currentDateValue <= dueDateValue) {
    return 0;
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return Math.floor(
    (currentDateValue - dueDateValue) /
      millisecondsPerDay
  );
}

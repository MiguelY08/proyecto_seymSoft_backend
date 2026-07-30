export function formatToColombia(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const optionsDate = {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  const optionsTime = {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const datePart = new Intl.DateTimeFormat("es-CO", optionsDate).format(date);
  const timePart = new Intl.DateTimeFormat("es-CO", optionsTime).format(date);

  return `${datePart} ${timePart}`;
}

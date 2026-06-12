export default function calculateUsedCredit({
  assignedCredit,
  availableCredit,
}) {
  return (
    Number(assignedCredit) -
    Number(availableCredit)
  );
}
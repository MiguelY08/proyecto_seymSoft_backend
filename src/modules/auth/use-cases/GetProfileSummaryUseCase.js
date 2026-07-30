import { NotFoundError } from "../../../shared/errors/index.js";
import calculatePendingInterest from "../../sales/payments/helpers/calculatePendingInterest.js";
import calculateOverdueDays from "../../sales/payments/helpers/calculateOverdueDays.js";
import { ProfileSummaryMapper } from "../mappers/profileSummaryMapper.js";

const millisecondsPerDay =
  1000 * 60 * 60 * 24;

const toNumber = (value) =>
  Number(value || 0);

const getPendingInterest = (credit) => {
  const generatedInterest =
    credit.credit_interests?.reduce(
      (total, interest) =>
        total +
        toNumber(
          interest.generated_amount
        ),
      0
    ) || 0;

  const paidInterest =
    credit.installments?.reduce(
      (total, installment) =>
        total +
        toNumber(
          installment.interest_paid
        ),
      0
    ) || 0;

  return calculatePendingInterest({
    generatedInterest,
    paidInterest,
  });
};

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const calculateDaysUntilDue = ({
  dueDate,
  currentDate = new Date(),
}) => {
  if (!dueDate) return 0;

  const today = startOfDay(currentDate);
  const due = startOfDay(dueDate);

  if (due <= today) {
    return 0;
  }

  return Math.ceil(
    (due - today) / millisecondsPerDay
  );
};

export class GetProfileSummaryUseCase {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute(idUser) {
    const profile =
      await this.repository.findSummaryByUserId(
        idUser
      );

    if (!profile) {
      throw new NotFoundError(
        "Usuario no encontrado"
      );
    }

    const client = profile.clients || null;
    const activeCredits =
      client?.credits || [];

    const creditLimit = toNumber(
      client?.credit
    );

    const pendingCapital =
      activeCredits.reduce(
        (total, credit) =>
          total +
          toNumber(
            credit.remaining_balance
          ),
        0
      );

    const pendingInterest =
      activeCredits.reduce(
        (total, credit) =>
          total +
          getPendingInterest(credit),
        0
      );

    const usedCredit =
      pendingCapital;

    const totalDebt =
      pendingCapital + pendingInterest;

    const availableCredit = Math.max(
      0,
      creditLimit - usedCredit
    );

    const favorBalance = toNumber(
      client?.credit_balance
    );

    const overdueCredits =
      activeCredits.filter(
        (credit) =>
          calculateOverdueDays({
            dueDate: credit.due_date,
          }) > 0
      );

    const nextCredit =
      activeCredits.find(
        (credit) =>
          calculateOverdueDays({
            dueDate: credit.due_date,
          }) === 0
      ) || null;

    const daysOverdue =
      overdueCredits.reduce(
        (maxDays, credit) =>
          Math.max(
            maxDays,
            calculateOverdueDays({
              dueDate: credit.due_date,
            })
          ),
        0
      );

    const overdueAmount =
      overdueCredits.reduce(
        (total, credit) =>
          total +
          toNumber(
            credit.remaining_balance
          ) +
          getPendingInterest(credit),
        0
      );

    const role =
      profile.employees
        ?.employee_roles
        ?.roles
        ?.name_role || null;

    return ProfileSummaryMapper.toDto({
      user: {
        fullName: profile.full_name || "",
        email: profile.email || "",
        role,
      },
      financialSummary: {
        creditLimit,
        usedCredit,
        totalDebt,
        pendingCapital,
        pendingInterest,
        availableCredit,
        favorBalance,
      },
      creditStatus: {
        hasActiveCredit:
          activeCredits.length > 0,
        nextDueDate:
          nextCredit?.due_date || null,
        daysUntilDue:
          calculateDaysUntilDue({
            dueDate:
              nextCredit?.due_date,
          }),
        hasOverdueDebt:
          overdueCredits.length > 0,
        daysOverdue,
        overdueAmount,
      },
    });
  }
}

import { paymentNotificationService } from "../services/paymentNotificationService.js";

const startOfToday = (date) => {
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  return currentDate;
};

export class NotifyOverdueCreditsUseCase {
  constructor(paymentsRepository) {
    this.paymentsRepository = paymentsRepository;
  }

  async execute(now = new Date()) {
    const processedAt = new Date(now);
    const currentDate = startOfToday(processedAt);

    const overdueCredits =
      await this.paymentsRepository.findOverdueCreditsPendingNotification(
        currentDate
      );

    const notifiedCredits = [];
    const errors = [];

    for (const credit of overdueCredits) {
      try {
        await paymentNotificationService.notifyCreditOverdue({
          paymentsRepository:
            this.paymentsRepository,
          idCredit:
            credit.id_credit,
          dueDate:
            credit.due_date,
          remainingBalance:
            credit.remaining_balance,
        });

        await this.paymentsRepository.markOverdueCreditNotificationSent(
          credit.id_credit,
          processedAt
        );

        notifiedCredits.push({
          idCredit:
            credit.id_credit,
          dueDate:
            credit.due_date,
          remainingBalance:
            credit.remaining_balance,
        });
      } catch (error) {
        errors.push({
          idCredit:
            credit.id_credit,
          error:
            error.message,
        });
      }
    }

    return {
      processedAt,
      checkedCredits:
        overdueCredits.length,
      notifiedCredits:
        notifiedCredits.length,
      notifications:
        notifiedCredits,
      errors,
    };
  }
}


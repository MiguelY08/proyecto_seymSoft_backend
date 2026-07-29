import { paymentNotificationService } from "../services/paymentNotificationService.js";
import { PAYMENT_BUSINESS_RULES } from "../constants/paymentBusinessRules.constants.js";

const startOfToday = (date) => {
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  return currentDate;
};

const addDays = (date, days) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  value.setHours(0, 0, 0, 0);
  return value;
};

export class NotifyOverdueCreditsUseCase {
  constructor(paymentsRepository) {
    this.paymentsRepository = paymentsRepository;
  }

  async execute(now = new Date()) {
    const processedAt = new Date(now);
    const currentDate = startOfToday(processedAt);
    const reminderDate = addDays(
      currentDate,
      PAYMENT_BUSINESS_RULES.CREDIT_DUE_REMINDER_DAYS
    );

    const creditsDueForReminder =
      await this.paymentsRepository.findCreditsDueOnDate(
        reminderDate
      );

    const overdueCredits =
      await this.paymentsRepository.findOverdueCreditsPendingNotification(
        currentDate
      );

    const reminderNotifications = [];
    const notifiedCredits = [];
    const errors = [];

    for (const credit of creditsDueForReminder) {
      try {
        const existingNotification =
          await this.paymentsRepository.hasCreditDueReminderNotification(
            credit.id_credit
          );

        if (existingNotification) {
          continue;
        }

        await paymentNotificationService.notifyCreditDueReminder({
          paymentsRepository:
            this.paymentsRepository,
          idCredit:
            credit.id_credit,
          dueDate:
            credit.due_date,
          remainingBalance:
            credit.remaining_balance,
          daysBeforeDue:
            PAYMENT_BUSINESS_RULES.CREDIT_DUE_REMINDER_DAYS,
        });

        reminderNotifications.push({
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
          event:
            "credit_due_reminder",
          error:
            error.message,
        });
      }
    }

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
          event:
            "credit_overdue",
          error:
            error.message,
        });
      }
    }

    return {
      processedAt,
      checkedReminderCredits:
        creditsDueForReminder.length,
      notifiedReminderCredits:
        reminderNotifications.length,
      checkedCredits:
        overdueCredits.length,
      notifiedCredits:
        notifiedCredits.length,
      reminderNotifications,
      notifications:
        notifiedCredits,
      errors,
    };
  }
}

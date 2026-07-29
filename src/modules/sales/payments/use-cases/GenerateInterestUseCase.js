import calculateInterestAmount from "../helpers/calculateInterestAmount.js";
import calculateOverdueDays from "../helpers/calculateOverdueDays.js";
import { PAYMENT_MESSAGES } from "../constants/paymentMessages.constants.js";
import { PAYMENT_BUSINESS_RULES } from "../constants/paymentBusinessRules.constants.js";
import { paymentNotificationService } from "../services/paymentNotificationService.js";

export class GenerateInterestUseCase {
  constructor(paymentsRepository) {
    this.paymentsRepository =
      paymentsRepository;
  }

  async execute({
    id_credit,
    percentage,
    userId,
  }) {
    if (
      !Number.isInteger(Number(percentage)) ||
      Number(percentage) <
        PAYMENT_BUSINESS_RULES.MIN_INTEREST_PERCENTAGE ||
      Number(percentage) >
        PAYMENT_BUSINESS_RULES.MAX_INTEREST_PERCENTAGE
    ) {
      throw new Error(
        PAYMENT_MESSAGES.INVALID_INTEREST_PERCENTAGE
      );
    }

    const credit =
      await this.paymentsRepository.getCreditById(
        id_credit
      );

    if (!credit) {
      throw new Error(
        PAYMENT_MESSAGES.CREDIT_NOT_FOUND
      );
    }

    if (
      Number(
        credit.remaining_balance
      ) <= 0
    ) {
      throw new Error(
        PAYMENT_MESSAGES.CREDIT_ALREADY_PAID
      );
    }

    const overdueDays =
      calculateOverdueDays({
        dueDate:
          credit.due_date,
      });

    if (overdueDays <= 0) {
      throw new Error(
        PAYMENT_MESSAGES.CREDIT_NOT_OVERDUE
      );
    }

    const generatedAmount =
      calculateInterestAmount({
        pendingCapital:
          Number(
            credit.remaining_balance
          ),

        percentage,
      });

    const interest =
      await this.paymentsRepository.createInterestTransaction(
        {
          id_credit,

          percentage,

          base_amount:
            credit.remaining_balance,

          generated_amount:
            generatedAmount,
        }
      );

    await paymentNotificationService.notifyInterestGenerated({
      paymentsRepository:
        this.paymentsRepository,
      idCredit:
        id_credit,
      actorUserId:
        userId,
      generatedAmount,
      idInterest:
        interest.id_interest,
    });

    return {
      message:
        PAYMENT_MESSAGES.INTEREST_CREATED,

      interest,

      generatedAmount,
    };
  }
}

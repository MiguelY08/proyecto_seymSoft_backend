import calculateInterestAmount from "../helpers/calculateInterestAmount.js";
import calculateOverdueDays from "../helpers/calculateOverdueDays.js";
import { PAYMENT_MESSAGES } from "../constants/paymentMessages.constants.js";

export class GenerateInterestUseCase {
  constructor(paymentsRepository) {
    this.paymentsRepository =
      paymentsRepository;
  }

  async execute({
    id_credit,
    percentage,
  }) {
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

    return {
      message:
        PAYMENT_MESSAGES.INTEREST_CREATED,

      interest,

      generatedAmount,
    };
  }
}
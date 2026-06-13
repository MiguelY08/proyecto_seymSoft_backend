import calculateInstallmentDistribution from "../helpers/calculateInstallmentDistribution.js";
import calculatePendingInterest from "../helpers/calculatePendingInterest.js";
import calculateTotalDebt from "../helpers/calculateTotalDebt.js";
import calculateCreditStatus from "../helpers/calculateCreditStatus.js";
import { PAYMENT_MESSAGES } from "../constants/paymentMessages.constants.js";

export class CreateInstallmentUseCase {
  constructor(paymentsRepository) {
    this.paymentsRepository =
      paymentsRepository;
  }

  async execute({
    id_credit,
    id_payment_method,
    installment_amount,
    observations,
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
      Number(installment_amount) <= 0
    ) {
      throw new Error(
        PAYMENT_MESSAGES.INVALID_INSTALLMENT_AMOUNT
      );
    }

    const pendingCapital =
      Number(
        credit.remaining_balance
      );

    if (pendingCapital <= 0) {
      throw new Error(
        PAYMENT_MESSAGES.CREDIT_ALREADY_PAID
      );
    }

    const generatedInterest =
      credit.credit_interests.reduce(
        (total, interest) =>
          total +
          Number(
            interest.generated_amount
          ),
        0
      );

    const paidInterest =
      credit.installments.reduce(
        (total, installment) =>
          total +
          Number(
            installment.interest_paid
          ),
        0
      );

    const pendingInterest =
      calculatePendingInterest({
        generatedInterest,
        paidInterest,
      });

    const totalDebt =
      calculateTotalDebt({
        pendingCapital,
        pendingInterest,
      });

    if (
      Number(installment_amount) >
      totalDebt
    ) {
      throw new Error(
        PAYMENT_MESSAGES.AMOUNT_EXCEEDS_DEBT
      );
    }

    const {
      capitalPaid,
      interestPaid,
    } =
      calculateInstallmentDistribution({
        installmentAmount:
          Number(
            installment_amount
          ),
        pendingInterest,
        pendingCapital,
      });

    const newRemainingBalance =
      pendingCapital - capitalPaid;

    const statuses =
      await this.paymentsRepository.getCreditStatusesMap();

    const creditStatus =
      calculateCreditStatus({
        remainingBalance:
          newRemainingBalance,

        dueDate:
          credit.due_date,

        pendingStatus:
          statuses.pending,

        paidStatus:
          statuses.paid,

        overdueStatus:
          statuses.overdue,
      });

    const installment =
      await this.paymentsRepository.processInstallment(
        {
          installmentData: {
            id_credit,

            id_payment_method,

            installment_amount,

            capital_paid:
              capitalPaid,

            interest_paid:
              interestPaid,

            observations,
          },

          id_credit,

          remaining_balance:
            newRemainingBalance,

          id_credit_status:
            creditStatus,
        }
      );

    return {
      message:
        PAYMENT_MESSAGES.INSTALLMENT_CREATED,

      installment,

      capitalPaid,

      interestPaid,

      remainingBalance:
        newRemainingBalance,
    };
  }
}
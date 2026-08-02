import calculateInstallmentDistribution from "../helpers/calculateInstallmentDistribution.js";
import calculatePendingInterest from "../helpers/calculatePendingInterest.js";
import calculateTotalDebt from "../helpers/calculateTotalDebt.js";
import calculateCreditStatus from "../helpers/calculateCreditStatus.js";
import InstallmentMapper from "../mappers/InstallmentMapper.js";
import { PAYMENT_MESSAGES } from "../constants/paymentMessages.constants.js";
import { PAYMENT_BUSINESS_RULES } from "../constants/paymentBusinessRules.constants.js";
import { paymentNotificationService } from "../services/paymentNotificationService.js";
import { PAYMENT_METHODS } from "../../../../shared/constants/generalStatuses.js";

const FAVOR_BALANCE_PAYMENT_METHOD_ID = PAYMENT_METHODS[4].id;
const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

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
    userId,
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

    const paymentMethod =
      await this.paymentsRepository.getPaymentMethodById(
        id_payment_method
      );

    if (!paymentMethod) {
      throw new Error(
        PAYMENT_MESSAGES.PAYMENT_METHOD_NOT_FOUND
      );
    }

    if (
      Number(id_payment_method) ===
      CREDIT_PAYMENT_METHOD_ID
    ) {
      throw new Error(
        PAYMENT_MESSAGES.INVALID_INSTALLMENT_PAYMENT_METHOD
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

    const installmentAmount =
      roundMoney(installment_amount);

    const roundedTotalDebt =
      roundMoney(totalDebt);

    if (installmentAmount <= 0) {
      throw new Error(
        PAYMENT_MESSAGES.INVALID_POSITIVE_INSTALLMENT_AMOUNT
      );
    }

    if (
      roundedTotalDebt <
        PAYMENT_BUSINESS_RULES.MIN_INSTALLMENT_AMOUNT &&
      installmentAmount !== roundedTotalDebt
    ) {
      throw new Error(
        PAYMENT_MESSAGES.INVALID_LOW_DEBT_INSTALLMENT_AMOUNT
      );
    }

    if (
      roundedTotalDebt >=
        PAYMENT_BUSINESS_RULES.MIN_INSTALLMENT_AMOUNT &&
      installmentAmount <
        PAYMENT_BUSINESS_RULES.MIN_INSTALLMENT_AMOUNT
    ) {
      throw new Error(
        PAYMENT_MESSAGES.INVALID_INSTALLMENT_AMOUNT
      );
    }

    if (
      installmentAmount >
      roundedTotalDebt
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
      Number(installment_amount),
    pendingInterest,
    pendingCapital,
  });

const client =
  await this.paymentsRepository.getClientById(
    credit.id_customer
  );

const isFavorBalancePayment =
  Number(id_payment_method) ===
  FAVOR_BALANCE_PAYMENT_METHOD_ID;

const favorBalance =
  roundMoney(client.credit_balance);

if (
  isFavorBalancePayment &&
  installmentAmount > favorBalance
) {
  throw new Error(
    PAYMENT_MESSAGES.INSUFFICIENT_FAVOR_BALANCE
  );
}

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
    await this.paymentsRepository.processInstallment({
      installmentData: {
        id_credit,
        id_payment_method,
        installment_amount,
        capital_paid: capitalPaid,
        interest_paid: interestPaid,
        observations,
        registered_by:
          userId,
      },

      id_credit,

      remaining_balance:
        newRemainingBalance,

      id_credit_status:
        creditStatus,

      id_customer:
        credit.id_customer,

      favor_balance_amount:
        isFavorBalancePayment
          ? installmentAmount
          : 0,
    });

await paymentNotificationService.notifyInstallmentCreated({
  paymentsRepository:
    this.paymentsRepository,
  idCredit:
    id_credit,
  actorUserId:
    userId,
  amount:
    installment_amount,
  idInstallment:
    installment.id_installment,
  remainingBalance:
    newRemainingBalance,
});

    return {
      message:
        PAYMENT_MESSAGES.INSTALLMENT_CREATED,

      installment:
        InstallmentMapper.toDto(
          installment
        ),

      capitalPaid,

      interestPaid,

      remainingBalance:
        newRemainingBalance,
    };
  }
}

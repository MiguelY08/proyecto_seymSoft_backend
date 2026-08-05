import calculateCanCancelInstallment from "../helpers/calculateCanCancelInstallment.js";
import calculateCreditStatus from "../helpers/calculateCreditStatus.js";

import { PAYMENT_MESSAGES } from "../constants/paymentMessages.constants.js";

import { comparePassword } from "../../../../shared/utils/hashPassword.js";
import { paymentNotificationService } from "../services/paymentNotificationService.js";
import {
  FAVOR_BALANCE_PAYMENT_METHOD_ID,
} from "../../shared/favorBalance.js";

export class CancelInstallmentUseCase {
  constructor(paymentsRepository) {
    this.paymentsRepository =
      paymentsRepository;
  }

  async execute({
    id_installment,
    reason,
    password,
    userId,
  }) {
    const installment =
      await this.paymentsRepository.getInstallmentById(
        id_installment
      );

    if (!installment) {
      throw new Error(
        PAYMENT_MESSAGES.INSTALLMENT_NOT_FOUND
      );
    }

    if (
      installment.is_cancelled
    ) {
      throw new Error(
        PAYMENT_MESSAGES.INSTALLMENT_ALREADY_CANCELLED
      );
    }

    const canCancel =
      calculateCanCancelInstallment({
        createdAt:
          installment.created_at ??
          installment.installment_date,
      });

    if (!canCancel) {
      throw new Error(
        PAYMENT_MESSAGES.INSTALLMENT_CANCELLATION_EXPIRED
      );
    }

    const user =
      await this.paymentsRepository.getUserById(
        userId
      );

    if (!user) {
      throw new Error(
        PAYMENT_MESSAGES.USER_NOT_FOUND
      );
    }

    const isPasswordValid =
      await comparePassword(
        password,
        user.pass_word
      );

    if (!isPasswordValid) {
      throw new Error(
        PAYMENT_MESSAGES.INVALID_PASSWORD
      );
    }

 const credit =
  installment.credits;

const client =
  credit.clients;

const restoredCapital =
  Number(
    installment.capital_paid
  );

const isFavorBalancePayment =
  Number(installment.id_payment_method) ===
  FAVOR_BALANCE_PAYMENT_METHOD_ID;

const restoredFavorBalance =
  isFavorBalancePayment
    ? Number(installment.installment_amount)
    : 0;

const newRemainingBalance =
  Number(
    credit.remaining_balance
  ) + restoredCapital;

    const statuses =
      await this.paymentsRepository.getCreditStatusesMap();

    const newStatus =
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

   await this.paymentsRepository
  .cancelInstallmentTransaction({
    id_installment,

    cancelled_at:
      new Date(),

    cancellation_reason:
      reason,

    cancelled_by:
      userId,

    id_credit:
      credit.id_credit,

    remaining_balance:
      newRemainingBalance,

    id_credit_status:
      newStatus,

    id_customer:
      client.id_client,

    favor_balance_amount:
      restoredFavorBalance,
  });

    await paymentNotificationService.notifyInstallmentCancelled({
      paymentsRepository:
        this.paymentsRepository,
      idCredit:
        credit.id_credit,
      actorUserId:
        userId,
      amount:
        installment.capital_paid,
      idInstallment:
        id_installment,
    });

    return {
      message:
        PAYMENT_MESSAGES.INSTALLMENT_CANCELLED,

      id_installment,

      cancelledBy: {
        id: user.id_user,
        nombre: user.full_name,
      },

      cancellationReason:
        reason,

      restoredCapital,

      remainingBalance:
        newRemainingBalance,
    };
  }
}

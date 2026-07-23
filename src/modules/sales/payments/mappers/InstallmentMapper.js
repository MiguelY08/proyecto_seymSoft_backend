import InstallmentDto from "../dtos/InstallmentDto.js";
import { PAYMENT_BUSINESS_RULES } from "../constants/paymentBusinessRules.constants.js";
import calculateCanCancelInstallment from "../helpers/calculateCanCancelInstallment.js";

export default class InstallmentMapper {
  static toDto(data) {
    const createdAt =
      data.created_at ??
      data.installment_date ??
      null;

    const isCancelled =
      Boolean(data.is_cancelled);

    const registeredByUser =
      data.registered_by_user ??
      data.users_installments_registered_byTousers;

    const cancelledByUser =
      data.cancelled_by_user ??
      data.users_installments_cancelled_byTousers;

    return new InstallmentDto({
      idInstallment: data.id_installment,

      installmentAmount: Number(data.installment_amount ?? 0),

      capitalPaid: Number(data.capital_paid ?? 0),

      interestPaid: Number(data.interest_paid ?? 0),

      createdAt,

      installmentDate: data.installment_date,

      observations: data.observations,

      isCancelled,

      canCancel:
        !isCancelled &&
        calculateCanCancelInstallment({
          createdAt,
        }),

      cancellationLimitHours:
        PAYMENT_BUSINESS_RULES.INSTALLMENT_CANCELLATION_HOURS,

      registeredBy: registeredByUser
      ? {
          id: registeredByUser.id_user,
          nombre: registeredByUser.full_name,
        }
      : null,

      cancelledAt: data.cancelled_at,

      cancellationReason: data.cancellation_reason,

      cancelledBy: cancelledByUser
      ? {
          id: cancelledByUser.id_user,
          nombre: cancelledByUser.full_name,
        }
      : null,

      paymentMethod: data.payment_methods
        ? {
            id: data.payment_methods.id_payment_method,
            nombre: data.payment_methods.name_payment_method,
          }
        : null,
    });
  }
}

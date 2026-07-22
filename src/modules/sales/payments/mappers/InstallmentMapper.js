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

      registeredBy: data.registered_by_user
      ? {
          id: data.registered_by_user.id_user,
          nombre: data.registered_by_user.full_name,
        }
      : null,

      cancelledAt: data.cancelled_at,

      cancellationReason: data.cancellation_reason,

      cancelledBy: data.cancelled_by_user
      ? {
          id: data.cancelled_by_user.id_user,
          nombre: data.cancelled_by_user.full_name,
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

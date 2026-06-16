import InstallmentDto from "../dtos/InstallmentDto.js";

export default class InstallmentMapper {
  static toDto(data) {
    return new InstallmentDto({
      idInstallment: data.id_installment,

      installmentAmount: Number(data.installment_amount ?? 0),

      capitalPaid: Number(data.capital_paid ?? 0),

      interestPaid: Number(data.interest_paid ?? 0),

      installmentDate: data.installment_date,

      observations: data.observations,

      isCancelled: data.is_cancelled,

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
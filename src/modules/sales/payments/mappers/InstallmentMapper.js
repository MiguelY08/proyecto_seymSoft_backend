import InstallmentDto from "../dtos/InstallmentDto.js";

export default class InstallmentMapper {
  static toDto(data) {
    return new InstallmentDto({
      idInstallment:
        data.idInstallment,

      installmentAmount:
        data.installmentAmount,

      capitalPaid:
        data.capitalPaid,

      interestPaid:
        data.interestPaid,

      installmentDate:
        data.installmentDate,

      observations:
        data.observations,

      isCancelled:
        data.isCancelled,

      cancelledAt:
        data.cancelledAt,

      cancellationReason:
        data.cancellationReason,

      cancelledBy:
        data.cancelledBy,

      paymentMethod:
        data.paymentMethod,
    });
  }
}
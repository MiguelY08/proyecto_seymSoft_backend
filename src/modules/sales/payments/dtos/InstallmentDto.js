export default class InstallmentDto {
  constructor({
    idInstallment,
    installmentAmount,
    capitalPaid,
    interestPaid,
    installmentDate,
    observations,

    isCancelled,
    cancelledAt,
    cancellationReason,
    cancelledBy,

    paymentMethod,
  }) {
    this.idInstallment =
      idInstallment ?? null;

    this.installmentAmount =
      Number(installmentAmount ?? 0);

    this.capitalPaid =
      Number(capitalPaid ?? 0);

    this.interestPaid =
      Number(interestPaid ?? 0);

    this.installmentDate =
      installmentDate ?? null;

    this.observations =
      observations ?? "";

    this.isCancelled =
      Boolean(isCancelled);

    this.cancelledAt =
      cancelledAt ?? null;

    this.cancellationReason =
      cancellationReason ?? "";

    this.cancelledBy =
      cancelledBy ?? null;

    this.paymentMethod =
      paymentMethod ?? null;
  }

  /**
   * Convierte el DTO al formato que espera el componente PaymentHistoryTable
   */

}
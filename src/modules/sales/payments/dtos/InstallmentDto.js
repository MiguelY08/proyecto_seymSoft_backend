export default class InstallmentDto {
  constructor({
    idInstallment,
    installmentAmount,
    capitalPaid,
    interestPaid,
    createdAt,
    installmentDate,
    observations,

    isCancelled,
    canCancel,
    cancellationLimitHours,
    registeredBy,
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

    this.createdAt =
      createdAt ?? null;

    this.installmentDate =
      installmentDate ?? null;

    this.observations =
      observations ?? "";

    this.isCancelled =
      Boolean(isCancelled);

    this.canCancel =
      Boolean(canCancel);

    this.cancellationLimitHours =
      Number(cancellationLimitHours ?? 0);

    this.registeredBy =
      registeredBy ?? null;

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

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
      idInstallment;

    this.installmentAmount =
      installmentAmount;

    this.capitalPaid =
      capitalPaid;

    this.interestPaid =
      interestPaid;

    this.installmentDate =
      installmentDate;

    this.observations =
      observations;

    this.isCancelled =
      isCancelled;

    this.cancelledAt =
      cancelledAt;

    this.cancellationReason =
      cancellationReason;

    this.cancelledBy =
      cancelledBy;

    this.paymentMethod =
      paymentMethod;
  }
}
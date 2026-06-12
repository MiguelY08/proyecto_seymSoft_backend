import InstallmentMapper from "../mappers/InstallmentMapper.js";

export default class GetInvoiceInstallmentsUseCase {
  constructor({
    repository,
  }) {
    this.repository = repository;
  }

  async execute(id_sale) {
    const credit =
      await this.repository.getCreditBySaleId(
        id_sale
      );

      

    if (!credit) {
      throw new Error(
        "La factura no posee crédito asociado"
      );
    }
    console.log(credit);

    const installments =
      credit.installments.map(
        (installment) => ({
          idInstallment:
            installment.id_installment,

          installmentAmount:
            Number(
              installment.installment_amount
            ),

          capitalPaid:
            Number(
              installment.capital_paid
            ),

          interestPaid:
            Number(
              installment.interest_paid
            ),

          installmentDate:
            installment.installment_date,

          observations:
            installment.observations,

        isCancelled:
          installment.is_cancelled,

        cancelledAt:
          installment.cancelled_at,

        cancellationReason:
          installment.cancellation_reason,

        cancelledBy:
          installment.cancelled_by_user
            ? {
                id:
                  installment
                    .cancelled_by_user
                    .id_user,

                fullName:
                  installment
                    .cancelled_by_user
                    .full_name,
              }
            : null,

        paymentMethod:
          installment
            .payment_methods
            ?.name_payment_method,
        })
      );

    return installments.map(
      InstallmentMapper.toDto
    );
  }
}
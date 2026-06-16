import InstallmentMapper from "../mappers/InstallmentMapper.js";

export default class GetInvoiceInstallmentsUseCase {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute(id_sale) {
    const credit =
      await this.repository.getCreditBySaleId(id_sale);

    if (!credit) {
      throw new Error(
        "La factura no posee crédito asociado"
      );
    }

    // ✅ DIRECTAMENTE AL MAPPER - SIN MAPEO MANUAL
    return credit.installments.map(
      (installment) => InstallmentMapper.toDto(installment)
    );
  }
}
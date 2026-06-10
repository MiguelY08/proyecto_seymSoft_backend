/**
 * DTO: InvoiceInstallmentsDto
 * Responsibility: Shape installments response for a given invoice.
 */
export default class InvoiceInstallmentsDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

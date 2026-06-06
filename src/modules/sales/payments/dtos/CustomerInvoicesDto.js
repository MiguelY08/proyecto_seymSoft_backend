/**
 * DTO: CustomerInvoicesDto
 * Responsibility: Shape a customer's invoices response.
 */
export default class CustomerInvoicesDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

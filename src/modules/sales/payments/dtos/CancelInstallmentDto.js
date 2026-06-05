/**
 * DTO: CancelInstallmentDto
 * Responsibility: Represent payload required to cancel an installment.
 */
export default class CancelInstallmentDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

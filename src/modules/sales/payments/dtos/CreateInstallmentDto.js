/**
 * DTO: CreateInstallmentDto
 * Responsibility: Represent payload required to create an installment.
 */
export default class CreateInstallmentDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

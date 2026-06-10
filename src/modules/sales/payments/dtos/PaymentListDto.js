/**
 * DTO: PaymentListDto
 * Responsibility: Shape a payment list response returned by controllers/use-cases.
 */
export default class PaymentListDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

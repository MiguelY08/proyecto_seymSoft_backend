/**
 * DTO: CustomerContactDto
 * Responsibility: Shape customer contact information returned by the system.
 */
export default class CustomerContactDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

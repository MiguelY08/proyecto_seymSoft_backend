/**
 * DTO: GenerateInterestDto
 * Responsibility: Represent payload required to generate interest.
 */
export default class GenerateInterestDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

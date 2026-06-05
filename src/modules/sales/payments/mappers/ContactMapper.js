/**
 * Mapper: ContactMapper
 * Responsibility: Convert contact domain models to DTOs and vice-versa.
 */
import CustomerContactDto from "../dtos/CustomerContactDto.js";

export default class ContactMapper {
  static toDto(entity = {}) {
    return new CustomerContactDto(entity);
  }

  static toDomain(dto = {}) {
    return { ...dto };
  }
}

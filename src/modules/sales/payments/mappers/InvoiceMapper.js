/**
 * Mapper: InvoiceMapper
 * Responsibility: Convert invoice domain models to DTOs and vice-versa.
 */
import CustomerInvoicesDto from "../dtos/CustomerInvoicesDto.js";

export default class InvoiceMapper {
  static toDto(entity = {}) {
    return new CustomerInvoicesDto(entity);
  }

  static toDomain(dto = {}) {
    return { ...dto };
  }
}

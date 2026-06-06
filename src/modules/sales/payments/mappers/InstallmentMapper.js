/**
 * Mapper: InstallmentMapper
 * Responsibility: Convert installment domain models to DTOs and vice-versa.
 */
import InvoiceInstallmentsDto from "../dtos/InvoiceInstallmentsDto.js";

export default class InstallmentMapper {
  static toDto(entity = {}) {
    return new InvoiceInstallmentsDto(entity);
  }

  static toDomain(dto = {}) {
    return { ...dto };
  }
}

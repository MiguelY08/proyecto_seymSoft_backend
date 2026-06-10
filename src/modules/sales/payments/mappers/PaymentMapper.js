/**
 * Mapper: PaymentMapper
 * Responsibility: Convert payment domain models to DTOs and vice-versa.
 */
import PaymentListDto from "../dtos/PaymentListDto.js";

export default class PaymentMapper {
  static toDto(entity = {}) {
    return new PaymentListDto(entity);
  }

  static toDomain(dto = {}) {
    return { ...dto };
  }
}

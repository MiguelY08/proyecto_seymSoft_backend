import InvoiceDto from "../dtos/InvoiceDto.js";

export default class InvoiceMapper {
  static toDto(data) {
    return new InvoiceDto(data);
  }
}
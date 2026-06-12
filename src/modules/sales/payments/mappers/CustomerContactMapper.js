import CustomerContactDto from "../dtos/CustomerContactDto.js";
import serializeBigInt from "../helpers/serializeBigInt.js";

export default class CustomerContactMapper {
  static toDto(data) {
    return new CustomerContactDto({
      ...data,
      phone: serializeBigInt(data.phone),
    });
  }
}

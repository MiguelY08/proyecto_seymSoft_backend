export class UpdateProviderDTO {
  constructor(data) {
    this.personType = data.personType;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.contactPersonName = data.contactPersonName;
    this.contactPersonNumber = data.contactPersonNumber;
    this.rut = data.rut;
    this.ciuCode = data.ciuCode;
    this.maxReturnPeriod = data.maxReturnPeriod ? parseInt(data.maxReturnPeriod) : null;
    this.idStatus = data.idStatus;
    this.categoryIds = data.categoryIds; // IDs de categorías (opcional)
  }
}
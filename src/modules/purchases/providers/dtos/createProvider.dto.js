export class CreateProviderDTO {
  constructor(data) {
    this.personType = data.personType;
    this.documentType = data.documentType;
    this.documentNumber = data.documentNumber;
    this.nameProvider = data.nameProvider;
    this.lastname = data.lastname;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.contactPersonName = data.contactPersonName || null;
    this.contactPersonNumber = data.contactPersonNumber ? Number(data.contactPersonNumber) : null;
    this.rut = data.rut;
    this.ciuCode = data.ciuCode || null;
    this.maxReturnPeriod = data.maxReturnPeriod ? parseInt(data.maxReturnPeriod) : null;
    this.idStatus = data.idStatus || 1;
    this.categoryIds = data.categoryIds || []; // IDs de categorías
  }
}
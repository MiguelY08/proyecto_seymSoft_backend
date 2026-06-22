// src/modules/sales/sales-returns/dtos/createReturnDto.js

export class CreateReturnDto {
  constructor(data) {
    this.idSale = data.idSale;
    this.description = data.description || '';
    this.hasDelivery = data.hasDelivery || false;
    this.deliveryAddress = data.deliveryAddress || '';
    this.details = data.details.map(detail => ({
      idProduct: detail.idProduct,
      barcode: detail.barcode,
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
      idReturnReason: detail.idReturnReason,
      idReturnMethod: detail.idReturnMethod,
      idBarcode: detail.idBarcode,
      status: detail.status || 'En Proceso',
      descripcionMotivo: detail.descripcionMotivo || '',
      metodo: detail.metodo || ''
    }));
  }
}
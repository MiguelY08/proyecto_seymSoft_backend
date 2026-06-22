// src/modules/sales/sales-returns/dtos/updateReturnDto.js

export class UpdateReturnDto {
  constructor(data) {
    this.status = data.status;
    this.description = data.description;
    this.details = data.details?.map(detail => ({
      idSaleReturnDetail: detail.idSaleReturnDetail,
      idReturnStatus: detail.idReturnStatus,
      idReturnMethod: detail.idReturnMethod
    }));
  }
}
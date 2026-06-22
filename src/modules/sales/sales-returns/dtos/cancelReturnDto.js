// src/modules/sales/sales-returns/dtos/cancelReturnDto.js

export class CancelReturnDto {
  constructor(data) {
    this.cancellationReason = data.cancellationReason;
  }
}
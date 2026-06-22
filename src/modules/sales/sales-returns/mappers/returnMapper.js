// src/modules/sales/sales-returns/mappers/returnMapper.js

import { 
  ReturnResponseDto, 
  ReturnListResponseDto,
  ReturnableSaleDto 
} from '../dtos/returnResponseDto.js';

export class ReturnMapper {
  
  static toDto(data) {
    if (!data) return null;
    return new ReturnResponseDto(data);
  }

  static toListDto(data) {
    if (!data) return null;
    return new ReturnListResponseDto(data);
  }

  static toReturnableSaleDto(data) {
    if (!data) return null;
    return new ReturnableSaleDto(data);
  }

  static toDtoList(data) {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => this.toDto(item));
  }

  static toListDtoList(data) {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => this.toListDto(item));
  }

  static toReturnableSaleDtoList(data) {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => this.toReturnableSaleDto(item));
  }

  static toCreatePrisma(data) {
    return {
      id_sale: data.idSale,
      return_number: data.returnNumber,
      id_return_status: data.idReturnStatus,
      total_amount: data.totalAmount,
      total_products: data.totalProducts,
      total_units: data.totalUnits,
      description: data.description,
      returnable_sale_data: data.returnableSaleData
    };
  }

  static toUpdatePrisma(data) {
    const updateData = {};
    
    if (data.idReturnStatus !== undefined) {
      updateData.id_return_status = data.idReturnStatus;
    }
    if (data.totalAmount !== undefined) {
      updateData.total_amount = data.totalAmount;
    }
    if (data.totalProducts !== undefined) {
      updateData.total_products = data.totalProducts;
    }
    if (data.totalUnits !== undefined) {
      updateData.total_units = data.totalUnits;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.cancellationReason !== undefined) {
      updateData.cancellation_reason = data.cancellationReason;
    }
    if (data.cancelledAt !== undefined) {
      updateData.cancelled_at = data.cancelledAt;
    }

    return updateData;
  }

  static toDetailPrisma(data) {
    return {
      barcode: data.barcode,
      quantity: data.quantity,
      id_return_reason: data.idReturnReason,
      id_return_method: data.idReturnMethod,
      id_return_status: data.idReturnStatus,
      id_barcode: data.idBarcode
    };
  }
}
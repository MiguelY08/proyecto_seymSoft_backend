// src/modules/sales/sales-returns/use-cases/getReturnableSalesUseCase.js

import { ReturnRepository } from '../repositories/returnRepository.js';

export const getReturnableSalesUseCase = async (clientId) => {
  try {

    const sales = await ReturnRepository.getReturnableSales(clientId);

    return {
      success: true,
      data: sales,
      error: null,
      errorCode: null
    };

  } catch (error) {

    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};

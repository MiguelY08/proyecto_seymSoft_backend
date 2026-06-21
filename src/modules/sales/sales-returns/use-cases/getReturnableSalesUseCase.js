// src/modules/sales/sales-returns/use-cases/getReturnableSalesUseCase.js

import { ReturnRepository } from '../repositories/returnRepository.js';

export const getReturnableSalesUseCase = async (clientId) => {
  try {
    console.log('📦 [getReturnableSalesUseCase] Buscando ventas para cliente:', clientId);
    
    const sales = await ReturnRepository.getReturnableSales(clientId);
    
    console.log('📦 [getReturnableSalesUseCase] Ventas encontradas:', sales.length);
    
    return {
      success: true,
      data: sales,
      error: null,
      errorCode: null
    };

  } catch (error) {
    console.error('[getReturnableSalesUseCase]', error);
    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};
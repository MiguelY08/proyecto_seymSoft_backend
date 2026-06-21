// src/modules/sales/sales-returns/use-cases/getReturnByIdUseCase.js

import { ReturnRepository } from '../repositories/returnRepository.js';

export const getReturnByIdUseCase = async (id) => {
  try {
    const returnData = await ReturnRepository.findById(id);
    
    if (!returnData) {
      return {
        success: false,
        data: null,
        error: 'Devolución no encontrada',
        errorCode: 'RETURN_NOT_FOUND'
      };
    }

    return {
      success: true,
      data: returnData,
      error: null,
      errorCode: null
    };

  } catch (error) {
    console.error('[getReturnByIdUseCase]', error);
    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};
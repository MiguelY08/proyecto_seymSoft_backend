// src/modules/sales/sales-returns/use-cases/getAllReturnsUseCase.js

import { ReturnRepository } from '../repositories/returnRepository.js';

export const getAllReturnsUseCase = async (filters) => {
  try {
    const result = await ReturnRepository.findAll(filters);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      error: null,
      errorCode: null
    };

  } catch (error) {
    console.error('[getAllReturnsUseCase]', error);
    return {
      success: false,
      data: null,
      pagination: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};
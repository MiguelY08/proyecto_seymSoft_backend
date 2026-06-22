// src/modules/sales/sales-returns/controllers/getAllReturnsController.js

import { getAllReturnsUseCase } from '../use-cases/getAllReturnsUseCase.js';

export const getAllReturnsController = async (req, res) => {
  try {
    const { page, limit, search, startDate, endDate } = req.query;

    const result = await getAllReturnsUseCase({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 13,
      search: search || '',
      startDate: startDate || '',
      endDate: endDate || '',
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error('[getAllReturnsController]', error);

    return res.status(500).json({
      success: false,
      message: 'Error obteniendo las devoluciones.',
      error: error.message,
    });
  }
};
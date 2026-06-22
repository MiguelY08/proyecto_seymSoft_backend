// src/modules/sales/sales-returns/controllers/getReturnableSalesController.js

import { getReturnableSalesUseCase } from '../use-cases/getReturnableSalesUseCase.js';

export const getReturnableSalesController = async (req, res) => {
  try {
    const { clientId } = req.query;

    console.log('📦 [getReturnableSalesController] clientId recibido:', clientId);

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del cliente es obligatorio',
      });
    }

    const result = await getReturnableSalesUseCase(Number(clientId));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }

    console.log('📦 [getReturnableSalesController] Ventas devueltas:', result.data.length);

    return res.status(200).json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('[getReturnableSalesController]', error);

    return res.status(500).json({
      success: false,
      message: 'Error obteniendo las ventas disponibles para devolución.',
      error: error.message,
    });
  }
};
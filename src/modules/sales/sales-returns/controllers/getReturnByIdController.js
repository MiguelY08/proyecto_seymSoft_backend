// src/modules/sales/sales-returns/controllers/getReturnByIdController.js

import { getReturnByIdUseCase } from '../use-cases/getReturnByIdUseCase.js';

export const getReturnByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getReturnByIdUseCase(Number(id));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    // ✅ LOG PARA VERIFICAR QUÉ DATOS TIENE returnable_sale_data
    console.log('📦 DATOS DE DEVOLUCIÓN (returnable_sale_data):', 
      JSON.stringify(result.data.returnable_sale_data || {}, null, 2));
    console.log('📦 DATOS COMPLETOS:', JSON.stringify(result.data, null, 2));

    return res.status(200).json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('[getReturnByIdController]', error);

    return res.status(500).json({
      success: false,
      message: 'Error obteniendo la devolución.',
      error: error.message,
    });
  }
};
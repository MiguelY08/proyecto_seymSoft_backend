// src/modules/sales/clients/controllers/getClientPurchasesController.js

import { getClientPurchasesUseCase } from '../use-cases/getClientPurchasesUseCase.js';

export const getClientPurchasesController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea un número válido
    const clientId = Number(id);
    if (isNaN(clientId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'El ID del cliente debe ser un número válido' 
      });
    }
    
    const result = await getClientPurchasesUseCase(clientId);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: result.error || 'Error al obtener las compras del cliente' 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.data 
    });
  } catch (error) {
    console.error('Error en getClientPurchasesController:', error);
    next(error);
  }
};
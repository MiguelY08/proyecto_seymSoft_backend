import { getClientFinancialSummaryUseCase } from '../use-cases/getClientFinancialSummaryUseCase.js';

export const getClientFinancialSummaryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clientId = Number(id);
    
    if (isNaN(clientId) || clientId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El ID del cliente debe ser un número válido'
      });
    }
    
    const result = await getClientFinancialSummaryUseCase(clientId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Error al obtener el resumen financiero del cliente'
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error en getClientFinancialSummaryController:', error);
    next(error);
  }
};
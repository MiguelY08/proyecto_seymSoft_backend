// src/modules/sales/sales-returns/controllers/deleteEvidenceController.js

import { ReturnRepository } from '../repositories/returnRepository.js';

export const deleteEvidenceController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID existe
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de evidencia requerido',
      });
    }

    // Validar que el ID sea numérico
    if (isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de evidencia inválido',
      });
    }

    // Eliminar la evidencia
    const result = await ReturnRepository.removeEvidence(Number(id));

    return res.status(200).json({
      success: true,
      message: 'Evidencia eliminada correctamente',
      data: result,
    });

  } catch (error) {
    console.error('[deleteEvidenceController]', error);
    
    // Manejar errores específicos
    if (error.message === 'Evidencia no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error eliminando la evidencia',
      error: error.message,
    });
  }
};
// src/modules/sales/sales-returns/controllers/getPurchaseReturnInfoController.js

import { ReturnRepository } from '../repositories/returnRepository.js';

export const getPurchaseReturnInfoController = async (req, res) => {
  try {
    const { idBarcode, saleReturnId } = req.query;

    if (!idBarcode) {
      return res.status(400).json({
        success: false,
        message: 'El ID del código de barras es obligatorio'
      });
    }

    const info = await ReturnRepository.getPurchaseReturnInfo(Number(idBarcode));

    // Verificar si ya existe producto no conforme
    const hasNCP = saleReturnId 
      ? await ReturnRepository.hasNonConformingProduct(Number(idBarcode), Number(saleReturnId))
      : false;

    // Verificar si ya existe devolución de compra
    const hasPR = await ReturnRepository.hasPurchaseReturn(Number(idBarcode), Number(saleReturnId));

    return res.status(200).json({
      success: true,
      data: {
        ...info,
        hasNonConformingProduct: hasNCP,
        hasPurchaseReturn: hasPR
      }
    });

  } catch (error) {
    console.error('[getPurchaseReturnInfoController]', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo información de devolución de compra',
      error: error.message
    });
  }
};
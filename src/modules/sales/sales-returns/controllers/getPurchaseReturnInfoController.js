// src/modules/sales/sales-returns/controllers/getPurchaseReturnInfoController.js

import { ReturnRepository } from '../repositories/returnRepository.js';
import { isNonSellableReason } from '../helpers/returnHelpers.js';

const isNonSellableDetailReason = (detail) =>
  isNonSellableReason(detail?.return_reasons?.description || '');

const isReadyStatus = (detail) =>
  String(detail?.return_statuses?.name_status || '').toLowerCase() === 'listo';

export const getPurchaseReturnInfoController = async (req, res) => {
  try {
    const { idBarcode, saleReturnId, saleReturnDetailId } = req.query;

    if (!idBarcode) {
      return res.status(400).json({
        success: false,
        message: 'El ID del código de barras es obligatorio'
      });
    }

    let requestedQuantity = 1;
    let resolution = null;

    if (saleReturnId && saleReturnDetailId) {
      const context = await ReturnRepository.findDefectiveReturnDetailContext(
        Number(saleReturnId),
        Number(saleReturnDetailId)
      );

      if (!context) {
        return res.status(404).json({
          success: false,
          message: 'El detalle de la devolución no existe'
        });
      }

      if (!isReadyStatus(context.detail)) {
        return res.status(200).json({
          success: true,
          data: {
            canReturn: false,
            reason: 'El producto debe estar en estado Listo para gestionar la devolución de compra o producto no conforme.',
            resolution: null
          }
        });
      }

      if (!isNonSellableDetailReason(context.detail)) {
        return res.status(200).json({
          success: true,
          data: {
            canReturn: false,
            reason: 'Solo los productos con motivo Producto defectuoso aplican para esta gestión.',
            resolution: null
          }
        });
      }

      requestedQuantity = context.detail.quantity || 1;
      resolution = context.resolution;
    }

    const info = await ReturnRepository.getPurchaseReturnInfo(
      Number(idBarcode),
      requestedQuantity
    );

    return res.status(200).json({
      success: true,
      data: {
        ...info,
        resolution,
        hasNonConformingProduct: resolution?.type === 'NON_CONFORMING',
        hasPurchaseReturn: resolution?.type === 'PURCHASE_RETURN'
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


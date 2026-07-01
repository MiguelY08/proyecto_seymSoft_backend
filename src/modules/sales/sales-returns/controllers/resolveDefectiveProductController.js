import { resolveDefectiveProductUseCase } from '../use-cases/resolveDefectiveProductUseCase.js';

const STATUS_BY_ERROR = {
  SALE_RETURN_DETAIL_NOT_FOUND: 404,
  SALE_RETURN_DETAIL_NOT_READY: 409,
  SALE_RETURN_DETAIL_NOT_DEFECTIVE: 409,
  BARCODE_NOT_FOUND: 400,
  DEFECTIVE_PRODUCT_ALREADY_RESOLVED: 409,
  PURCHASE_RETURN_NOT_AVAILABLE: 409,
  PURCHASE_RETURN_AVAILABLE: 409,
  INVALID_RETURN_QUANTITY: 400,
  INVALID_ACTION: 400,
  PURCHASE_RETURN_CREATE_FAILED: 400,
};

export const resolveDefectiveProductController = async (req, res) => {
  try {
    const { id, detailId } = req.params;
    const { action, quantity, idReturnReason, idReturnMethod } = req.body || {};

    const result = await resolveDefectiveProductUseCase({
      saleReturnId: Number(id),
      saleReturnDetailId: Number(detailId),
      action,
      quantity,
      idReturnReason,
      idReturnMethod,
    });

    if (!result.success) {
      return res.status(STATUS_BY_ERROR[result.errorCode] || 500).json({
        success: false,
        message: result.error,
        errorCode: result.errorCode,
        data: result.data || null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Producto defectuoso gestionado correctamente',
      data: result.data
    });
  } catch (error) {
    console.error('[resolveDefectiveProductController]', error);
    return res.status(500).json({
      success: false,
      message: 'Error gestionando el producto defectuoso',
      error: error.message
    });
  }
};

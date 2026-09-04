import { ReturnRepository } from '../repositories/returnRepository.js';
import { createPurchaseReturnUseCase } from '../../../purchases/purchase-returns/use-cases/create.usecase.js';
import { RETURN_DETAIL_STATUS_IDS } from '../../../purchases/purchase-returns/helpers/purchaseReturnHelper.js';
import { salesReturnNotificationService } from '../helpers/salesReturnNotificationService.js';
import { isNonSellableReason } from '../helpers/returnHelpers.js';

const RESOLUTION_ACTIONS = {
  PURCHASE_RETURN: 'PURCHASE_RETURN',
  NON_CONFORMING: 'NON_CONFORMING',
};

const isReadyStatus = (detail) =>
  String(detail?.return_statuses?.name_status || '').toLowerCase() === 'listo';

const isNonSellableDetailReason = (detail) =>
  isNonSellableReason(detail?.return_reasons?.description || '');

const validateBaseContext = async (saleReturnId, saleReturnDetailId) => {
  const context = await ReturnRepository.findDefectiveReturnDetailContext(
    saleReturnId,
    saleReturnDetailId
  );

  if (!context) {
    return {
      success: false,
      errorCode: 'SALE_RETURN_DETAIL_NOT_FOUND',
      error: 'El detalle de la devolución no existe.'
    };
  }

  if (!isReadyStatus(context.detail)) {
    return {
      success: false,
      errorCode: 'SALE_RETURN_DETAIL_NOT_READY',
      error: 'El producto debe estar en estado Listo para resolverlo.'
    };
  }

  if (!isNonSellableDetailReason(context.detail)) {
    return {
      success: false,
      errorCode: 'SALE_RETURN_DETAIL_NOT_NON_SELLABLE',
      error: 'Solo los productos con motivo Producto defectuoso pueden pasar por esta gestión.'
    };
  }

  if (!context.detail.id_barcode) {
    return {
      success: false,
      errorCode: 'BARCODE_NOT_FOUND',
      error: 'El producto no tiene código de barras asociado.'
    };
  }

  if (context.resolution) {
    return {
      success: false,
      errorCode: 'DEFECTIVE_PRODUCT_ALREADY_RESOLVED',
      error: 'Este producto defectuoso ya fue gestionado.',
      data: context.resolution
    };
  }

  return {
    success: true,
    context
  };
};

export const resolveDefectiveProductUseCase = async ({
  saleReturnId,
  saleReturnDetailId,
  action,
  quantity,
  idReturnReason,
  idReturnMethod,
  actorUserId = null,
}) => {
  try {
    const baseValidation = await validateBaseContext(
      Number(saleReturnId),
      Number(saleReturnDetailId)
    );

    if (!baseValidation.success) {
      return baseValidation;
    }

    const { context } = baseValidation;
    const detailQuantity = Math.max(1, Number(context.detail.quantity || 1));
    const purchaseInfo = await ReturnRepository.getPurchaseReturnInfo(
      context.detail.id_barcode,
      detailQuantity
    );

    if (action === RESOLUTION_ACTIONS.PURCHASE_RETURN) {
      if (!purchaseInfo.canReturn) {
        return {
          success: false,
          errorCode: 'PURCHASE_RETURN_NOT_AVAILABLE',
          error: purchaseInfo.reason || 'No es posible generar devolución de compra para este producto.',
          data: purchaseInfo
        };
      }

      const requestedQuantity = Math.max(1, Number(quantity || detailQuantity));
      const maximumQuantity = Math.min(
        detailQuantity,
        Number(purchaseInfo.availableQuantity || 0)
      );

      if (requestedQuantity > maximumQuantity) {
        return {
          success: false,
          errorCode: 'INVALID_RETURN_QUANTITY',
          error: `Solo puedes devolver ${maximumQuantity} unidad(es) a la compra.`,
          data: purchaseInfo
        };
      }

      const createdPurchaseReturn = await createPurchaseReturnUseCase({
        idPurchase: Number(purchaseInfo.idPurchase),
        details: [{
          idPurchaseDetail: Number(purchaseInfo.idPurchaseDetail),
          quantity: requestedQuantity,
          idReturnReason: Number(idReturnReason || 5),
          idReturnMethod: Number(idReturnMethod || 1),
          idReturnStatus: RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
        }]
      });

      if (!createdPurchaseReturn.success) {
        return {
          success: false,
          errorCode: createdPurchaseReturn.errorCode || 'PURCHASE_RETURN_CREATE_FAILED',
          error: createdPurchaseReturn.error || 'No se pudo crear la devolución de compra.',
          data: createdPurchaseReturn.data
        };
      }

      const resolution = await ReturnRepository.saveDefectiveResolution(
        saleReturnId,
        context.saleData,
        {
          type: RESOLUTION_ACTIONS.PURCHASE_RETURN,
          detailId: Number(saleReturnDetailId),
          referenceId: createdPurchaseReturn.data?.id_purchase_return
            || createdPurchaseReturn.data?.id
            || createdPurchaseReturn.data?.idPurchaseReturn
            || null,
          purchaseId: Number(purchaseInfo.idPurchase),
          purchaseDetailId: Number(purchaseInfo.idPurchaseDetail),
          quantity: requestedQuantity,
          createdAt: new Date().toISOString()
        }
      );

      await salesReturnNotificationService.notifyDefectiveResolution({
        saleReturnId,
        saleReturnDetailId,
        actorUserId,
        action: RESOLUTION_ACTIONS.PURCHASE_RETURN,
        referenceId: createdPurchaseReturn.data?.id_purchase_return
          || createdPurchaseReturn.data?.id
          || createdPurchaseReturn.data?.idPurchaseReturn
          || null,
        quantity: requestedQuantity,
      });

      return {
        success: true,
        data: {
          resolution,
          purchaseReturn: createdPurchaseReturn.data
        },
        error: null,
        errorCode: null
      };
    }

    if (action === RESOLUTION_ACTIONS.NON_CONFORMING) {
      if (purchaseInfo.canReturn) {
        return {
          success: false,
          errorCode: 'PURCHASE_RETURN_AVAILABLE',
          error: 'Este producto todavía puede generar devolución de compra. Usa esa opción primero.',
          data: purchaseInfo
        };
      }

      const defaultStatus = await ReturnRepository.getDefaultNonConformingStatus();
      const saleReturnNumber = context.saleReturn?.return_number || `DEV-${saleReturnId}`;
      const nonConformingReason = [
        `Producto defectuoso proveniente de la devolución de venta ${saleReturnNumber}.`,
        'No tiene devolución de compra disponible.',
        purchaseInfo.reason || ''
      ].join(' ').trim();

      const ncp = await ReturnRepository.createNonConformingProduct({
        idBarcode: context.detail.id_barcode,
        quantity: detailQuantity,
        reason: nonConformingReason,
        idStatus: defaultStatus?.id_status || 1
      });

      const resolution = await ReturnRepository.saveDefectiveResolution(
        saleReturnId,
        context.saleData,
        {
          type: RESOLUTION_ACTIONS.NON_CONFORMING,
          detailId: Number(saleReturnDetailId),
          referenceId: ncp.id_ncp,
          quantity: detailQuantity,
          reason: purchaseInfo.reason || 'No fue posible generar devolución de compra.',
          createdAt: new Date().toISOString()
        }
      );

      await salesReturnNotificationService.notifyDefectiveResolution({
        saleReturnId,
        saleReturnDetailId,
        actorUserId,
        action: RESOLUTION_ACTIONS.NON_CONFORMING,
        referenceId: ncp.id_ncp,
        quantity: detailQuantity,
      });

      return {
        success: true,
        data: {
          resolution,
          nonConformingProduct: ncp
        },
        error: null,
        errorCode: null
      };
    }

    return {
      success: false,
      errorCode: 'INVALID_ACTION',
      error: 'Acción inválida para resolver el producto defectuoso.'
    };
  } catch (error) {
    console.error('[resolveDefectiveProductUseCase]', error);
    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};



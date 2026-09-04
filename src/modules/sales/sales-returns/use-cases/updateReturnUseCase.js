// src/modules/sales/sales-returns/use-cases/updateReturnUseCase.js

import { prisma } from '../../../../config/prisma.js';
import { ReturnRepository } from '../repositories/returnRepository.js';
import { 
  RETURN_STATUS,
  calculateGeneralStatus
} from '../helpers/returnHelpers.js';
import { salesReturnNotificationService } from '../helpers/salesReturnNotificationService.js';

export const updateReturnUseCase = async (id, updateData, evidenceFiles = [], actorUserId = null) => {
  try {
    // 1. Verificar que la devolución existe
    const existingReturn = await ReturnRepository.findRawById(id);
    if (!existingReturn) {
      return {
        success: false,
        data: null,
        error: 'Devolución no encontrada',
        errorCode: 'RETURN_NOT_FOUND'
      };
    }

    // 2. Verificar que no esté anulada
    if (existingReturn.return_statuses?.name_status === RETURN_STATUS.CANCELLED) {
      return {
        success: false,
        data: null,
        error: 'No se puede editar una devolución anulada',
        errorCode: 'RETURN_IS_CANCELLED'
      };
    }

    // 3. Validar que solo se actualicen los estados de los productos
    if (updateData.status) {
      return {
        success: false,
        data: null,
        error: 'No se puede modificar el estado general de la devolución directamente. Se calcula automáticamente.',
        errorCode: 'CANNOT_UPDATE_GENERAL_STATUS'
      };
    }

    // 4. Si hay detalles para actualizar
    let newGeneralStatus = existingReturn.return_statuses?.name_status || 'En Proceso';
    let stockUpdated = false;
    let stockEvents = [];
    let readyEvents = [];
    
    if (updateData.details && updateData.details.length > 0) {
      // Obtener los detalles actuales para comparar estados
      const currentDetails = await prisma.sale_return_details.findMany({
        where: { id_sales_return: id },
        include: {
          barcodes: true,
          return_methods: true,
          return_reasons: true,
          return_statuses: true
        }
      });

      // Validar antes de mover stock o saldo.
      for (const detail of updateData.details) {
        // Buscar el detalle actual
        const currentDetail = currentDetails.find(d => d.id_sale_return_detail === detail.idSaleReturnDetail);
        if (!currentDetail) {
          return {
            success: false,
            data: null,
            error: `El detalle ${detail.idSaleReturnDetail} no pertenece a esta devolución`,
            errorCode: 'VALIDATION_ERROR'
          };
        }

        if (
          currentDetail.return_statuses?.name_status === 'Listo' &&
          Number(currentDetail.id_return_status) !== Number(detail.idReturnStatus)
        ) {
          return {
            success: false,
            data: null,
            error: 'No se puede modificar un producto que ya está en estado Listo.',
            errorCode: 'READY_DETAIL_LOCKED'
          };
        }

        if (currentDetail.return_statuses?.name_status === 'Anulado') {
          return {
            success: false,
            data: null,
            error: 'No se puede modificar un producto anulado.',
            errorCode: 'CANCELLED_DETAIL_LOCKED'
          };
        }

      }

      stockEvents = await ReturnRepository.applyStockForDetailUpdates(
        id,
        updateData.details
      );
      stockUpdated = stockEvents.length > 0;

      // Actualizar los estados de los productos
      for (const detail of updateData.details) {
        const detailData = {
          id_return_status: detail.idReturnStatus
        };

        if (detail.idReturnMethod) {
          detailData.id_return_method = detail.idReturnMethod;
        }
        
        await prisma.sale_return_details.update({
          where: { id_sale_return_detail: detail.idSaleReturnDetail },
          data: detailData
        });
      }

      // Obtener los detalles actualizados para calcular el nuevo estado general
      const updatedDetails = await prisma.sale_return_details.findMany({
        where: { id_sales_return: id },
        include: {
          return_statuses: true,
          return_methods: true,
          return_reasons: true,
          barcodes: {
            include: {
              products: {
                select: { name: true }
              }
            }
          }
        }
      });

      readyEvents = updatedDetails
        .filter(detail => detail.return_statuses?.name_status === 'Listo')
        .filter(detail => {
          const previous = currentDetails.find(
            current => current.id_sale_return_detail === detail.id_sale_return_detail
          );
          return previous?.return_statuses?.name_status !== 'Listo';
        })
        .map(detail => ({
          detailId: detail.id_sale_return_detail,
          productName: detail.barcodes?.products?.name || detail.barcode || 'Producto',
          quantity: Number(detail.quantity || 0),
          method: detail.return_methods?.description || '',
          reason: detail.return_reasons?.description || '',
        }));

      // Mapear los detalles para calcular el estado general
      const detailsForStatus = updatedDetails.map(detail => ({
        id: detail.id_sale_return_detail,
        estado: detail.return_statuses?.name_status || 'En Proceso',
        metodo: detail.return_methods?.description || ''
      }));

      // Calcular el nuevo estado general
      const newStatus = calculateGeneralStatus(detailsForStatus);
      newGeneralStatus = newStatus;
    }

    // 5. Obtener el ID del nuevo estado
    const statusRecord = await ReturnRepository.findReturnStatusByName(newGeneralStatus);
    if (!statusRecord) {
      return {
        success: false,
        data: null,
        error: `Estado "${newGeneralStatus}" no encontrado`,
        errorCode: 'STATUS_NOT_FOUND'
      };
    }

    // 6. Actualizar la devolución con el nuevo estado calculado
    const updated = await ReturnRepository.update(id, {
      idReturnStatus: statusRecord.id_return_status,
      totalAmount: updateData.totalAmount || Number(existingReturn.total_amount || 0),
      totalProducts: updateData.totalProducts || existingReturn.total_products || 0,
      totalUnits: updateData.totalUnits || existingReturn.total_units || 0,
      description: updateData.description || existingReturn.description || '',
      evidenceDescription: updateData.evidenceDescription || '',
      details: updateData.details || []
    }, evidenceFiles);

    const creditEvents = await ReturnRepository.applyCreditForReadyDetails(
      id,
      updateData.details || []
    );

    if (creditEvents.length > 0) {
      await salesReturnNotificationService.notifyCreditApplied({
        events: creditEvents,
        actorUserId,
      });
    }

    if (readyEvents.length > 0) {
      await salesReturnNotificationService.notifyReadyDetails({
        returnId: id,
        events: readyEvents,
        actorUserId,
      });
    }

    return {
      success: true,
      data: {
        id: updated.id_sales_return,
        returnNumber: updated.return_number,
        status: newGeneralStatus,
        stockUpdated: stockUpdated,
        nonConformingCreated: 0,
        creditApplied: creditEvents.reduce((total, event) => total + event.amount, 0),
        creditEvents,
        readyEvents,
        stockEvents
      },
      error: null,
      errorCode: null
    };

  } catch (error) {
    console.error('[updateReturnUseCase]', error);
    if (error.message?.includes('stock suficiente')) {
      return {
        success: false,
        data: null,
        error: error.message,
        errorCode: 'INSUFFICIENT_REPLACEMENT_STOCK'
      };
    }
    if (error.message?.includes('revertir el movimiento')) {
      return {
        success: false,
        data: null,
        error: error.message,
        errorCode: 'STOCK_MOVEMENT_ALREADY_USED'
      };
    }
    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};

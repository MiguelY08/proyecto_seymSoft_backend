// src/modules/sales/sales-returns/use-cases/updateReturnUseCase.js

import { prisma } from '../../../../config/prisma.js';
import { ReturnRepository } from '../repositories/returnRepository.js';
import { 
  RETURN_STATUS,
  calculateGeneralStatus,
  isDefectiveReason
} from '../helpers/returnHelpers.js';

export const updateReturnUseCase = async (id, updateData, evidenceFiles = []) => {
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
    const nonConformingToCreate = [];
    
    if (updateData.details && updateData.details.length > 0) {
      // Obtener los detalles actuales para comparar estados
      const currentDetails = await prisma.sale_return_details.findMany({
        where: { id_sales_return: id },
        include: {
          barcodes: true,
          return_methods: true,
          return_reasons: true
        }
      });

      // Actualizar los estados de los productos
      for (const detail of updateData.details) {
        // Buscar el detalle actual
        const currentDetail = currentDetails.find(d => d.id_sale_return_detail === detail.idSaleReturnDetail);
        
        // Verificar si el motivo actual es defectuoso
        const isDefective = currentDetail?.return_reasons?.description 
          ? isDefectiveReason(currentDetail.return_reasons.description)
          : false;

        // Si es defectuoso y tiene barcode, verificar si necesita producto no conforme
        if (isDefective && currentDetail?.id_barcode) {
          // Verificar si ya existe un producto no conforme para este barcode
          const existingNCP = await prisma.non_conforming_products.findFirst({
            where: {
              id_barcode: currentDetail.id_barcode,
              report_reason: {
                contains: `devolución ${id}`
              }
            }
          });

          if (!existingNCP) {
            nonConformingToCreate.push({
              idBarcode: currentDetail.id_barcode,
              quantity: currentDetail.quantity,
              reason: `Producto defectuoso detectado en devolución ${id}`,
              idStatus: 1 // Pendiente
            });
          }
        }

        // Si el producto pasa a "Listo" (id: 4) y NO estaba en "Listo" antes
        if (detail.idReturnStatus === 4 && currentDetail?.id_return_status !== 4) {
          await prisma.barcodes.update({
            where: {
              id_barcode: currentDetail.id_barcode
            },
            data: {
              stock: {
                increment: currentDetail.quantity
              }
            }
          });
          stockUpdated = true;
        }

        await prisma.sale_return_details.update({
          where: { id_sale_return_detail: detail.idSaleReturnDetail },
          data: {
            id_return_status: detail.idReturnStatus,
            id_return_method: detail.idReturnMethod
          }
        });
      }

      // Crear productos no conformes
      if (nonConformingToCreate.length > 0) {
        const defaultStatus = await ReturnRepository.getDefaultNonConformingStatus();
        const statusId = defaultStatus?.id_status || 1;

        for (const ncp of nonConformingToCreate) {
          try {
            await ReturnRepository.createNonConformingProduct({
              idBarcode: ncp.idBarcode,
              quantity: ncp.quantity,
              reason: ncp.reason,
              idStatus: statusId
            });
          } catch (error) {
            console.error('[updateReturnUseCase] Error creando producto no conforme:', error);
          }
        }
      }

      // Obtener los detalles actualizados para calcular el nuevo estado general
      const updatedDetails = await prisma.sale_return_details.findMany({
        where: { id_sales_return: id },
        include: {
          return_statuses: true,
          return_methods: true
        }
      });

      // Mapear los detalles para calcular el estado general
      const detailsForStatus = updatedDetails.map(detail => ({
        id: detail.id_sale_return_detail,
        estado: detail.return_statuses?.name_status || 'En Proceso',
        metodo: detail.return_methods?.description || ''
      }));

      // Calcular el nuevo estado general
      const newStatus = calculateGeneralStatus(detailsForStatus);
      newGeneralStatus = newStatus === 'COMPLETED' ? 'Procesada' : 
                         newStatus === 'CANCELLED' ? 'Anulado' : 'En Proceso';
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
      details: updateData.details || []
    }, evidenceFiles);

    return {
      success: true,
      data: {
        id: updated.id_sales_return,
        returnNumber: updated.return_number,
        status: newGeneralStatus,
        stockUpdated: stockUpdated,
        nonConformingCreated: nonConformingToCreate.length
      },
      error: null,
      errorCode: null
    };

  } catch (error) {
    console.error('[updateReturnUseCase]', error);
    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};
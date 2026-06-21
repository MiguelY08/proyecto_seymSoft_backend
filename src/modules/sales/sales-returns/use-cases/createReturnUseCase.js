// src/modules/sales/sales-returns/use-cases/createReturnUseCase.js

import { prisma } from '../../../../config/prisma.js';
import { ReturnRepository } from '../repositories/returnRepository.js';
import { 
  generateReturnNumber,
  RETURN_STATUS,
  isDefectiveReason,
  calculateGeneralStatus
} from '../helpers/returnHelpers.js';

export const createReturnUseCase = async (returnData, evidenceFiles = [], evidenceDescription = '') => {
  console.log('🔥🔥🔥 createReturnUseCase EJECUTADO 🔥🔥🔥');
  console.log('📦 returnData:', JSON.stringify(returnData, null, 2));
  console.log('📦 evidenceFiles length:', evidenceFiles?.length || 0);
  console.log('📦 evidenceDescription:', evidenceDescription);

  try {
    // 1. Validar que la venta existe
    const sale = await ReturnRepository.findSaleById(returnData.idSale);
    if (!sale) {
      console.log('❌ Venta no encontrada:', returnData.idSale);
      return {
        success: false,
        data: null,
        error: 'La venta no existe',
        errorCode: 'SALE_NOT_FOUND'
      };
    }

    console.log('📦 [createReturnUseCase] Venta encontrada:', sale.id_sale);

    // 2. Verificar que la venta no tenga ya una devolución
    const existingReturn = await prisma.sales_returns.findFirst({
      where: { id_sale: returnData.idSale }
    });
    if (existingReturn) {
      console.log('❌ Venta ya tiene devolución:', returnData.idSale);
      return {
        success: false,
        data: null,
        error: 'Esta venta ya tiene una devolución registrada',
        errorCode: 'RETURN_ALREADY_EXISTS'
      };
    }

    // 3. Obtener estado "En Proceso" (fallback)
    const pendingStatus = await ReturnRepository.findReturnStatusByName('En Proceso');
    if (!pendingStatus) {
      console.log('❌ Estado "En Proceso" no encontrado');
      return {
        success: false,
        data: null,
        error: 'Estado "En Proceso" no encontrado',
        errorCode: 'STATUS_NOT_FOUND'
      };
    }

    // 4. Generar número de devolución
    const returnNumber = generateReturnNumber();

    // ============================================================
    // 5. CONSTRUIR DATOS DE LA VENTA CON TODA LA INFORMACIÓN
    // ============================================================
    const order = sale.sales_orders;
    const client = order?.clients;
    const clientUser = client?.users;
    const employee = sale.employees;
    const employeeUser = employee?.users;

    const invoiceNumber = String(sale.id_sale);

    const clientName = clientUser?.full_name || '';
    let clientPhone = clientUser?.phone || client?.contact_person_number || null;
    if (clientPhone !== null && clientPhone !== undefined) {
      clientPhone = String(clientPhone);
    }
    const clientAddress = client?.address || '';

    const employeeName = employeeUser?.full_name || '';

    const hasDelivery = returnData.hasDelivery || false;
    const deliveryAddress = returnData.deliveryAddress || '';

    const returnableSaleData = {
      invoiceNumber: invoiceNumber,
      saleDate: sale.sale_date,
      subtotal: Number(sale.subtotal || 0),
      total: Number(order?.total || sale.subtotal || 0),
      clientName: clientName,
      clientId: order?.id_customer || '',
      clientPhone: clientPhone,
      clientAddress: clientAddress,
      employeeName: employeeName,
      hasDelivery: hasDelivery,
      deliveryAddress: deliveryAddress
    };

    console.log('📦 [createReturnUseCase] returnableSaleData:', JSON.stringify(returnableSaleData, null, 2));

    // ============================================================
    // 6. CALCULAR TOTALES Y PREPARAR DETALLES
    // ============================================================
    let totalAmount = 0;
    let totalUnits = 0;
    const totalProducts = returnData.details.length;

    console.log('📦 [createReturnUseCase] Productos a procesar:', returnData.details.length);

    const nonConformingToCreate = [];
    const details = [];

    for (const detail of returnData.details) {
  const quantity = detail.quantity || 1;
  const unitPrice = detail.unitPrice || 0;
  totalAmount += quantity * unitPrice;
  totalUnits += quantity;

  const isDefective = isDefectiveReason(detail.reasonName || '');

  // Si es defectuoso, verificar si está dentro del plazo de compra
  if (isDefective && detail.idBarcode) {
    try {
      const purchaseInfo = await ReturnRepository.getPurchaseReturnInfo(detail.idBarcode);
      if (!purchaseInfo.canReturn) {
        nonConformingToCreate.push({
          idBarcode: detail.idBarcode,
          quantity: quantity,
          reason: `Producto defectuoso detectado en devolución venta #${returnNumber} - ${detail.reasonName || 'Sin motivo'}`
        });
      }
    } catch (error) {
      console.error('[createReturnUseCase] Error verificando compra:', error);
      nonConformingToCreate.push({
        idBarcode: detail.idBarcode,
        quantity: quantity,
        reason: `Producto defectuoso (error verificación) en devolución #${returnNumber}`
      });
    }
  }

  // ✅ OBTENER ESTADO SELECCIONADO
  const statusName = detail.status || 'En Proceso';
  const statusRecord = await ReturnRepository.findReturnStatusByName(statusName);
  const statusId = statusRecord?.id_return_status || pendingStatus.id_return_status;

  const isOther = detail.idReturnReason === 4;

  details.push({
    barcode: detail.barcode,
    quantity: quantity,
    idReturnReason: detail.idReturnReason,
    idReturnMethod: detail.idReturnMethod,
    idReturnStatus: statusId,  // ✅ CAMBIADO: usa statusId
    idBarcode: detail.idBarcode,
    reasonName: detail.reasonName || '',
    isDefective: isDefective,
    description: isOther ? detail.descripcionMotivo || '' : '',
    estado: statusName,
    metodo: detail.metodo || ''
  });
}

    console.log('📦 [createReturnUseCase] Detalles preparados:', details.length);

    // ============================================================
    // 7. CALCULAR ESTADO GENERAL DE LA DEVOLUCIÓN
    // ============================================================
    const productStatuses = details.map(d => ({
      estado: d.estado || 'En Proceso',
      metodo: d.metodo || ''
    }));
    const generalStatus = calculateGeneralStatus(productStatuses);
    const generalStatusRecord = await ReturnRepository.findReturnStatusByName(generalStatus);
    const generalStatusId = generalStatusRecord?.id_return_status || pendingStatus.id_return_status;

    console.log('📦 [createReturnUseCase] Estado general calculado:', generalStatus, 'ID:', generalStatusId);

    // ============================================================
    // 8. CREAR LA DEVOLUCIÓN
    // ============================================================
    const created = await ReturnRepository.create({
      idSale: returnData.idSale,
      returnNumber,
      idReturnStatus: generalStatusId,
      totalAmount,
      totalProducts,
      totalUnits,
      description: returnData.description || '',
      returnableSaleData,
      details,
      evidenceDescription: evidenceDescription
    }, evidenceFiles);

    console.log('📦 [createReturnUseCase] Devolución creada:', created.id_sales_return);

    // ============================================================
    // 9. CREAR PRODUCTOS NO CONFORMES AUTOMÁTICAMENTE
    // ============================================================
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
          console.log(`[createReturnUseCase] Producto no conforme creado para barcode: ${ncp.idBarcode}`);
        } catch (error) {
          console.error('[createReturnUseCase] Error creando producto no conforme:', error);
        }
      }
    }

    return {
      success: true,
      data: {
        id: created.id_sales_return,
        returnNumber: created.return_number,
        status: generalStatus,
        nonConformingCreated: nonConformingToCreate.length
      },
      error: null,
      errorCode: null
    };

  } catch (error) {
    console.error('❌❌❌ ERROR EN createReturnUseCase ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};
// src/modules/sales/sales-returns/use-cases/createReturnUseCase.js

import { prisma } from '../../../../config/prisma.js';
import { ReturnRepository } from '../repositories/returnRepository.js';
import { 
  generateReturnNumber,
  RETURN_STATUS,
  isDefectiveReason,
  calculateGeneralStatus
} from '../helpers/returnHelpers.js';
import { evaluateSaleReturnEligibility } from '../helpers/saleReturnEligibility.js';

export const createReturnUseCase = async (returnData, evidenceFiles = [], evidenceDescription = '') => {
  console.log('🔥🔥🔥 createReturnUseCase EJECUTADO 🔥🔥🔥');
  console.log('📦 returnData:', JSON.stringify(returnData, null, 2));
  console.log('📦 evidenceFiles length:', evidenceFiles?.length || 0);
  console.log('📦 evidenceDescription:', evidenceDescription);

  try {
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

    const eligibility = evaluateSaleReturnEligibility(sale);
    if (!eligibility.canReturn) {
      return {
        success: false,
        data: null,
        error: eligibility.reason,
        errorCode: 'SALE_NOT_RETURNABLE'
      };
    }

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

    const returnNumber = generateReturnNumber();

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
      deliveryAddress: deliveryAddress,
      details: returnData.details.map(detail => ({
        idProduct: detail.idProduct,
        barcode: detail.barcode,
        idBarcode: detail.idBarcode,
        productName: detail.productName || '',
        quantity: detail.quantity,
        unitPrice: Number(detail.unitPrice || 0),
        imageUrl: detail.imageUrl || null,
        isDefective: isDefectiveReason(detail.reasonName || ''),
        applyCredit: detail.idReturnMethod === 3 && detail.applyCredit === true,
        creditApplied: false,
        stockApplied: false,
        stockDelta: 0
      }))
    };

    console.log('📦 [createReturnUseCase] returnableSaleData:', JSON.stringify(returnableSaleData, null, 2));

    let totalAmount = 0;
    let totalUnits = 0;
    const totalProducts = returnData.details.length;

    console.log('📦 [createReturnUseCase] Productos a procesar:', returnData.details.length);

    const details = [];

    for (const detail of returnData.details) {
      const quantity = detail.quantity || 1;
      const unitPrice = detail.unitPrice || 0;
      totalAmount += quantity * unitPrice;
      totalUnits += quantity;

      const isDefective = isDefectiveReason(detail.reasonName || '');

      // ✅ OBTENER ESTADO SELECCIONADO - SOLUCIÓN ERROR #1
      const statusName = detail.status || 'Pend. envio';
      console.log('📦 statusName recibido:', statusName);
      const statusRecord = await ReturnRepository.findReturnStatusByName(statusName);
      const statusId = statusRecord?.id_return_status || pendingStatus.id_return_status;
      console.log('📦 statusId encontrado:', statusId, 'para statusName:', statusName);

      const isOther = detail.idReturnReason === 4;

      details.push({
        barcode: detail.barcode,
        quantity: quantity,
        idReturnReason: detail.idReturnReason,
        idReturnMethod: detail.idReturnMethod,
        idReturnStatus: statusId,  // ✅ SOLUCIÓN ERROR #1
        idBarcode: detail.idBarcode,
        reasonName: detail.reasonName || '',
        isDefective: isDefective,
        description: isOther ? detail.descripcionMotivo || '' : '',
        estado: statusName,
        metodo: detail.metodo || ''
      });
    }

    console.log('📦 [createReturnUseCase] Detalles preparados:', details.length);

    const productStatuses = details.map(d => ({
      estado: d.estado || 'En Proceso',
      metodo: d.metodo || ''
    }));
    const generalStatus = calculateGeneralStatus(productStatuses);
    const generalStatusRecord = await ReturnRepository.findReturnStatusByName(generalStatus);
    const generalStatusId = generalStatusRecord?.id_return_status || pendingStatus.id_return_status;

    console.log('📦 [createReturnUseCase] Estado general calculado:', generalStatus, 'ID:', generalStatusId);

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

    return {
      success: true,
      data: {
        id: created.id_sales_return,
        returnNumber: created.return_number,
        status: generalStatus,
        nonConformingCreated: 0
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

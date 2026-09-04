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
import { salesReturnNotificationService } from '../helpers/salesReturnNotificationService.js';

export const createReturnUseCase = async (
  returnData,
  evidenceFiles = [],
  evidenceDescription = '',
  actorUserId = null
) => {
  try {
    const sale = await ReturnRepository.findSaleById(returnData.idSale);
    if (!sale) {

      return {
        success: false,
        data: null,
        error: 'La venta no existe',
        errorCode: 'SALE_NOT_FOUND'
      };
    }

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
      where: { id_sale: returnData.idSale },
      select: { return_number: true }
    });
    if (existingReturn) {
      const existingReturnNumber = existingReturn.return_number || 'registrada';

      return {
        success: false,
        data: null,
        error: 'Esta venta ya tiene una devolución registrada',
        errorCode: 'RETURN_ALREADY_EXISTS',
        existingReturnNumber
      };
    }

    const pendingStatus = await ReturnRepository.findReturnStatusByName('En Proceso');
    if (!pendingStatus) {

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
        reasonName: detail.reasonName || '',
        idReturnReason: detail.idReturnReason,
        method: detail.metodo || detail.method || '',
        idReturnMethod: detail.idReturnMethod,
        status: detail.status || 'Pend. envio',
        isDefective: isDefectiveReason(detail.reasonName || ''),
        applyCredit: detail.idReturnMethod === 3 || detail.metodo === 'Saldo a favor',
        creditApplied: false,
        stockApplied: false,
        stockDelta: 0
      }))
    };

    let totalAmount = 0;
    let totalUnits = 0;
    const totalProducts = returnData.details.length;

    const details = [];

    for (const detail of returnData.details) {
      const quantity = detail.quantity || 1;
      const unitPrice = detail.unitPrice || 0;
      totalAmount += quantity * unitPrice;
      totalUnits += quantity;

      const isDefective = isDefectiveReason(detail.reasonName || '');
      const statusName = detail.status || 'Pend. envio';

      const statusRecord = await ReturnRepository.findReturnStatusByName(statusName);
      const statusId = statusRecord?.id_return_status || pendingStatus.id_return_status;

      const isOther = detail.idReturnReason === 4;

      details.push({
        barcode: detail.barcode,
        quantity: quantity,
        idReturnReason: detail.idReturnReason,
        idReturnMethod: detail.idReturnMethod,
        idReturnStatus: statusId,
        idBarcode: detail.idBarcode,
        reasonName: detail.reasonName || '',
        isDefective: isDefective,
        description: isOther ? detail.descripcionMotivo || '' : '',
        estado: statusName,
        metodo: detail.metodo || ''
      });
    }

    const productStatuses = details.map(d => ({
      estado: d.estado || 'En Proceso',
      metodo: d.metodo || ''
    }));
    const generalStatus = calculateGeneralStatus(productStatuses);
    const generalStatusRecord = await ReturnRepository.findReturnStatusByName(generalStatus);
    const generalStatusId = generalStatusRecord?.id_return_status || pendingStatus.id_return_status;

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

    const createdDetails = await prisma.sale_return_details.findMany({
      where: { id_sales_return: created.id_sales_return },
      include: {
        return_methods: true,
        return_statuses: true
      }
    });

    const readyDetails = createdDetails
      .filter(detail => detail.return_statuses?.name_status === 'Listo')
      .map(detail => ({
        idSaleReturnDetail: detail.id_sale_return_detail,
        idReturnStatus: detail.id_return_status
      }));

    const stockEvents = readyDetails.length > 0
      ? await ReturnRepository.applyStockForDetailUpdates(
        created.id_sales_return,
        readyDetails
      )
      : [];

    const readyCreditDetails = createdDetails
      .filter(detail =>
        detail.return_statuses?.name_status === 'Listo' &&
        detail.return_methods?.description === 'Saldo a favor'
      )
      .map(detail => ({
        idSaleReturnDetail: detail.id_sale_return_detail,
        idReturnStatus: detail.id_return_status
      }));

    const creditEvents = readyCreditDetails.length > 0
      ? await ReturnRepository.applyCreditForReadyDetails(
        created.id_sales_return,
        readyCreditDetails
      )
      : [];

    if (creditEvents.length > 0) {
      await salesReturnNotificationService.notifyCreditApplied({
        events: creditEvents,
        actorUserId,
      });
    }

    return {
      success: true,
      data: {
        id: created.id_sales_return,
        returnNumber: created.return_number,
        status: generalStatus,
        nonConformingCreated: 0,
        creditApplied: creditEvents.reduce((total, event) => total + event.amount, 0),
        creditEvents,
        stockEvents
      },
      error: null,
      errorCode: null
    };

  } catch (error) {



    return {
      success: false,
      data: null,
      error: error.message,
      errorCode: 'DATABASE_ERROR'
    };
  }
};

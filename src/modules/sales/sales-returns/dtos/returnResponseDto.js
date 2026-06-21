// src/modules/sales/sales-returns/dtos/returnResponseDto.js

export class ReturnResponseDto {
  constructor(data) {
    // ✅ Extraer datos del JSON returnable_sale_data
    const saleData = data.returnable_sale_data || {};
    
    // ==================== DATOS PRINCIPALES ====================
    this.id = data.id_sales_return;
    this.returnNumber = data.return_number;
    this.idSale = data.id_sale;
    this.totalAmount = Number(data.total_amount || 0);
    this.totalProducts = data.total_products || 0;
    this.totalUnits = data.total_units || 0;
    this.status = data.return_statuses?.name_status || 'En Proceso';
    this.statusId = data.id_return_status;
    this.description = data.description || '';
    this.cancellationReason = data.cancellation_reason || null;
    this.cancelledAt = data.cancelled_at || null;
    this.createdAt = data.creation_date;
    this.updatedAt = data.updated_at;
    
    // ==================== DATOS DE LA VENTA ====================
    this.invoiceNumber = saleData.invoiceNumber || null;
    this.saleDate = saleData.saleDate || null;
    this.subtotal = saleData.subtotal || 0;
    this.total = saleData.total || 0;
    
    // ==================== DATOS DEL CLIENTE ====================
    this.clientName = saleData.clientName || null;
    this.clientId = saleData.clientId || null;
    this.clientPhone = saleData.clientPhone || null;
    this.clientAddress = saleData.clientAddress || null;
    
    // ==================== DATOS DEL EMPLEADO ====================
    this.employeeName = saleData.employeeName || null;
    
    // ==================== DATOS DE DOMICILIO ====================
    this.hasDelivery = saleData.hasDelivery || false;
    this.deliveryAddress = saleData.deliveryAddress || null;
    
    // ==================== DETALLES DE PRODUCTOS ====================
    this.details = data.sale_return_details?.map(detail => ({
      id: detail.id_sale_return_detail,
      barcode: detail.barcode,
      quantity: detail.quantity,
      unitPrice: Number(detail.barcodes?.products?.retail_price || 0),
      reason: detail.return_reasons?.description || '',
      reasonId: detail.id_return_reason,
      method: detail.return_methods?.description || '',
      methodId: detail.id_return_method,
      status: detail.return_statuses?.name_status || 'Pendiente',
      statusId: detail.id_return_status,
      productName: detail.barcodes?.products?.name || '',
      productId: detail.barcodes?.id_product || null,
      description: detail.description || ''
    })) || [];
    
    // ==================== EVIDENCIAS ====================
    this.evidences = data.sale_return_evidence?.map(ev => ({
      id: ev.id_evidence,
      imageUrl: ev.image_path,
      image_description: ev.image_description || ''
    })) || [];
    
    // ==================== CAMPOS EN ESPAÑOL PARA EL FRONTEND ====================
    this.numeroDevolucion = this.returnNumber;
    this.numeroFactura = this.invoiceNumber;
    this.cliente = this.clientName;
    this.asesor = this.employeeName;
    this.telefono = this.clientPhone;
    this.direccion = this.deliveryAddress || this.clientAddress;
    this.fechaCreacion = this.createdAt;
    this.totalValor = this.totalAmount;
    this.estado = this.status;
    this.evidencias = this.evidences;
    this.productosDevueltos = this.details;
  }
}

export class ReturnListResponseDto {
  constructor(data) {
    const saleData = data.returnable_sale_data || {};
    
    this.id = data.id_sales_return;
    this.returnNumber = data.return_number;
    this.invoiceNumber = saleData.invoiceNumber || null;
    this.clientName = saleData.clientName || null;
    this.employeeName = saleData.employeeName || null;
    this.clientPhone = saleData.clientPhone || null;
    this.clientAddress = saleData.clientAddress || null;
    this.hasDelivery = saleData.hasDelivery || false;
    this.deliveryAddress = saleData.deliveryAddress || null;
    this.totalAmount = Number(data.total_amount || 0);
    this.status = data.return_statuses?.name_status || 'En Proceso';
    this.statusId = data.id_return_status;
    this.createdAt = data.creation_date;
    this.totalProducts = data.total_products || 0;
    this.totalUnits = data.total_units || 0;
    this.motivo = data.sale_return_details?.[0]?.return_reasons?.description || '';
    this.descripcionMotivo = data.sale_return_details?.[0]?.description || '';
    this.description = data.description || '';
    
    // ✅ DETALLES CON PRECIO
    this.details = data.sale_return_details?.map(detail => ({
      id: detail.id_sale_return_detail,
      productName: detail.barcodes?.products?.name || 'Producto sin nombre',
      barcode: detail.barcode || '',
      quantity: Number(detail.quantity || 0),
      unitPrice: Number(detail.barcodes?.products?.retail_price || detail.unit_price || 0),
      reason: detail.return_reasons?.description || '',
      method: detail.return_methods?.description || '',
      status: detail.return_statuses?.name_status || 'Pendiente',
      description: detail.description || ''
    })) || [];
    
    // ✅ EVIDENCIAS
    this.evidences = data.sale_return_evidence?.map(ev => ({
      id: ev.id_evidence,
      imageUrl: ev.image_path,
      image_description: ev.image_description || ''
    })) || [];
    
    // ✅ CAMPOS EN ESPAÑOL
    this.numeroDevolucion = this.returnNumber;
    this.numeroFactura = this.invoiceNumber;
    this.cliente = this.clientName;
    this.asesor = this.employeeName;
    this.telefono = this.clientPhone;
    this.direccion = this.deliveryAddress || this.clientAddress;
    this.fechaCreacion = this.createdAt;
    this.totalValor = this.totalAmount;
    this.estado = this.status;
    this.evidencias = this.evidences;
    this.productosDevueltos = this.details;
  }
}
export class ReturnableSaleDto {
  constructor(data) {
    this.idSale = data.idSale;
    this.idOrder = data.idOrder;
    this.invoiceNumber = data.invoiceNumber;
    this.clientName = data.clientName;
    this.clientId = data.clientId;
    this.employeeName = data.employeeName;
    this.saleDate = data.saleDate;
    this.subtotal = data.subtotal;
    this.total = data.total;
    this.details = data.details?.map(detail => ({
      id: detail.id,
      idProduct: detail.idProduct,
      productName: detail.productName,
      barcode: detail.barcode,
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
      subtotal: detail.subtotal,
      ivaAmount: detail.ivaAmount
    })) || [];
  }
}
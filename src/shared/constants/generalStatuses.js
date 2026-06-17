export const GENERAL_STATUSES = {
  1: { id: 1, name: "Activo" },
  2: { id: 2, name: "Inactivo" },
};

export const PAYMENT_METHODS = {
  1: { id: 1, name: "Transferencia" },
  2: { id: 2, name: "Efectivo" },
  3: { id: 3, name: "Credito" },
};

export const PAYMENT_STATUSES = {
  1: { id: 1, name: "Pendiente", description: "Pago-Abono pendiente" },
  2: { id: 2, name: "Pagado", description: "Pedido pagado" },
};

export const SALE_STATUSES = {
  1: { id: 1, name: "Aprobada", description: "Venta aprobada" },
  2: { id: 2, name: "Denegada", description: "Venta denegada" },
  3: { id: 3, name: "Esp. aprobacion", description: "Se requiere una accion" },
  4: { id: 4, name: "Anulada", description: "Venta anulada" },
  5: { id: 5, name: "Proc. devolucion", description: "Venta en proceso de devolucion" },
};

export const ORDER_STATUSES = {
  1: { id: 1, name: "En proceso", description: "Pedido en construccion" },
  2: { id: 2, name: "Listo", description: "Pedido preparado" },
  3: { id: 3, name: "Entregado", description: "Pedido entregado al cliente" },
  4: { id: 4, name: "Cancelado", description: "Pedido cancelado" },
};


export const CREDIT_STATUSES = {
  1: { id: 1, name: "Pendiente" },
  2: { id: 2, name: "Pagado" },
  3: { id: 3, name: "Vencido" },
};

export const CLIENT_TYPES = {
  RETAIL: "detal",
  WHOLESALE: "mayorista",
  PARTNER: "colega",
  PARTNERS: "colegas",
  BULK: "paca",
  BULKS: "pacas",
};

export const ORDER_PAYMENT_EXPIRATION = {
  HOURS_TO_PAY: 48,
  REMINDER_6H: 6,
  REMINDER_1H: 1,
};

// Constantes para devoluciones en compras y ventas
export const PURCHASE_STATUSES = {
  1: { id: 1, name: "Completada"},
  2: { id: 2, name: "Proc. devolución" },
  3: { id: 3, name: "Anulada" },
  4: { id: 4, name: "Completada (*)" },
  5: { id: 5, name: "Completada (!)" },
  6: { id: 6, name: "Proc. devolución (!)" },
};

export const RETURN_STATUSES = {
  1: {
    id: 1,
    name: "Pend. envío",
    p_description: "Enviar productos al proveedor",
    s_description: "Esp. envío del cliente"
  },
  2: {
    id: 2,
    name: "Pend. reemplazo",
    p_description: "Esp. reemplazo/s del proveedor",
    s_description: "Enviar reemplazo/s al cliente"
  },
  3: {
    id: 3,
    name: "Pend. reembolso",
    p_description: "Esp. reembolso del proveedor",
    s_description: "Enviar reembolso al cliente"
  },
  4: {
    id: 4,
    name: "Listo",
    p_description: "Reemplazos-Reembolso recibido/s",
    s_description: "Reemplazos/Reembolso enviados al cliente"
  },
  5: {
    id: 5,
    name: "Anulada",
    p_description: "Devolución de compra anulada",
    s_description: "Devolución de venta anulada"
  },
};

export const RETURN_METHODS = {
  1: { id: 1, description: "Reemplazo" },
  2: { id: 2, description: "Reembolso" },
  3: { id: 3, description: "Prod. no conforme" },
};

export const RETURN_REASONS = {
  1: { id: 1, description: "Prod. en mal estado" },
  2: { id: 2, description: "Insatisfecho" },
  3: { id: 3, description: "Prod. incorrecto" },
  4: { id: 4, description: "Otro motivo" },
};
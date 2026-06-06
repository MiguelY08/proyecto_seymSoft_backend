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



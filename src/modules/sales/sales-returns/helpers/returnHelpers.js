// src/modules/sales/sales-returns/helpers/returnHelpers.js

export const RETURN_STATUS = {
  IN_PROCESS: 'En Proceso',
  COMPLETED: 'Procesada',
  CANCELLED: 'Anulado'
};

export const RETURN_LIFECYCLE = {
  IN_PROCESS: 'En Proceso',
  COMPLETED: 'Procesada',
  CANCELLED: 'Anulado'
};

export const RETURN_METHODS = {
  REPLACEMENT: 'Reemplazo',
  REFUND: 'Reembolso',
  CREDIT: 'Saldo a favor'
};

export const RETURN_REASONS = {
  DEFECTIVE: 'DEFECTUOSO',
  WRONG_PRODUCT: 'PRODUCTO_EQUIVOCADO',
  INCOMPLETE: 'PRODUCTO_INCOMPLETO',
  BAD_CONDITION: 'MAL_ESTADO',
  USED: 'PRODUCTO_USADO',
  OTHER: 'OTRO'
};

export const RETURN_REASONS_LABELS = {
  'DEFECTUOSO': 'Producto defectuoso',
  'PRODUCTO_EQUIVOCADO': 'Producto equivocado',
  'PRODUCTO_INCOMPLETO': 'Producto incompleto',
  'MAL_ESTADO': 'Producto en mal estado',
  'PRODUCTO_USADO': 'Producto usado',
  'OTRO': 'Otro'
};

/**
 * Genera número de devolución
 * Formato: DEV-YYYY-XXXX
 */
export const generateReturnNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DEV-${year}-${random}`;
};

/**
 * Calcula el estado general de la devolución basado en los estados de los productos
 */
export const calculateGeneralStatus = (details = []) => {
  if (!details || details.length === 0) {
    return 'En Proceso';
  }

  const completedStatuses = ['Aprobada', 'Entregado', 'Listo', 'Procesada'];
  const cancelledStatuses = ['Anulado'];

  const allCancelled = details.every(detail =>
    cancelledStatuses.includes(detail.estado)
  );
  const activeDetails = details.filter(detail =>
    !cancelledStatuses.includes(detail.estado)
  );
  const allCompleted = activeDetails.length > 0 && activeDetails.every(detail =>
    completedStatuses.includes(detail.estado)
  );

  if (allCancelled) {
    return 'Anulado';
  }

  if (allCompleted) {
    return 'Procesada';
  }

  return 'En Proceso';
};

/**
 * Valida si el motivo es defectuoso (para generar producto no conforme)
 */
export const normalizeReturnText = (value = '') => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/_/g, ' ')
  .trim()
  .toUpperCase();

export const isNonSellableReason = (reason) => {
  const normalized = normalizeReturnText(reason);
  return [
    'DEFECTUOSO',
    'PRODUCTO DEFECTUOSO',
    'MAL ESTADO',
    'PRODUCTO EN MAL ESTADO',
    'PRODUCTO USADO',
    'USADO',
    'PRODUCTO INCOMPLETO',
    'INCOMPLETO'
  ].some(term => normalized.includes(term));
};

export const isSellableReason = (reason) => {
  const normalized = normalizeReturnText(reason);
  return [
    'PRODUCTO EQUIVOCADO',
    'EQUIVOCADO',
    'OTRO',
    'OTRO MOTIVO'
  ].some(term => normalized.includes(term));
};

export const isDefectiveReason = (reason) => isNonSellableReason(reason);

/**
 * Mapeo de estados para el frontend
 */
export const getStatusStyle = (status) => {
  const styles = {
    'En Proceso': 'text-yellow-700 bg-yellow-100',
    'Procesada': 'text-green-700 bg-green-100',
    'Anulado': 'text-red-600 bg-red-100'
  };
  return styles[status] || styles['En Proceso'];
};

export const getStatusText = (status) => {
  const texts = {
    'En Proceso': 'En Proceso',
    'Procesada': 'Procesada',
    'Anulado': 'Anulado'
  };
  return texts[status] || status;
};

/**
 * Formatea moneda COP
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Formatea fecha
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const calculateReturnStockDelta = ({ method, reason, isDefective, quantity }) => {
  const units = Math.max(0, Number(quantity || 0));
  if (units <= 0) return 0;

  const normalizedMethod = normalizeReturnText(method);
  const reasonIsNonSellable = isNonSellableReason(reason);
  const reasonIsSellable = isSellableReason(reason);
  const returnsToSellableStock = reasonIsSellable
    ? true
    : reasonIsNonSellable
      ? false
      : !isDefective;

  if (normalizedMethod.includes('REEMPLAZO')) {
    return returnsToSellableStock ? 0 : -units;
  }

  return returnsToSellableStock ? units : 0;
};


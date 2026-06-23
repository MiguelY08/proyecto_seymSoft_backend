export const DELIVERY_TYPES = {
  PICKUP: 'Recoge',
  DELIVERY: 'Domicilio',
};

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const normalizeDeliveryType = (value = DELIVERY_TYPES.PICKUP) => {
  const normalized = normalizeText(value);

  if (['recoge', 'pickup'].includes(normalized)) {
    return DELIVERY_TYPES.PICKUP;
  }

  if (['domicilio', 'delivery'].includes(normalized)) {
    return DELIVERY_TYPES.DELIVERY;
  }

  throw new Error('deliveryType debe ser Recoge o Domicilio.');
};

export const normalizeDeliveryAddress = (deliveryType, value) => {
  const address = String(value || '').trim();

  if (deliveryType === DELIVERY_TYPES.DELIVERY && !address) {
    throw new Error('La direccion de entrega es obligatoria para Domicilio.');
  }

  if (deliveryType === DELIVERY_TYPES.PICKUP) {
    return address || 'El cliente lo recoge';
  }

  return address;
};

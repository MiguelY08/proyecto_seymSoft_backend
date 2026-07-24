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

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized || null;
};

const validateMaxLength = (field, value, maxLength) => {
  if (value && value.length > maxLength) {
    throw new Error(`${field} no puede exceder ${maxLength} caracteres.`);
  }
};

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

export const normalizeDeliveryLocation = (deliveryType, location = {}) => {
  const deliveryDepartmentCode = normalizeOptionalText(
    location.deliveryDepartmentCode
  );
  const deliveryDepartmentName = normalizeOptionalText(
    location.deliveryDepartmentName
  );
  const deliveryCityCode = normalizeOptionalText(
    location.deliveryCityCode
  );
  const deliveryCityName = normalizeOptionalText(
    location.deliveryCityName
  );

  validateMaxLength('El codigo del departamento de entrega', deliveryDepartmentCode, 10);
  validateMaxLength('El nombre del departamento de entrega', deliveryDepartmentName, 100);
  validateMaxLength('El codigo del municipio o ciudad de entrega', deliveryCityCode, 20);
  validateMaxLength('El nombre del municipio o ciudad de entrega', deliveryCityName, 100);

  if (deliveryType === DELIVERY_TYPES.DELIVERY) {
    if (!deliveryDepartmentCode || !deliveryDepartmentName) {
      throw new Error('El departamento de entrega es obligatorio para Domicilio.');
    }

    if (!deliveryCityCode || !deliveryCityName) {
      throw new Error('El municipio o ciudad de entrega es obligatorio para Domicilio.');
    }
  }

  return {
    deliveryDepartmentCode,
    deliveryDepartmentName,
    deliveryCityCode,
    deliveryCityName,
  };
};

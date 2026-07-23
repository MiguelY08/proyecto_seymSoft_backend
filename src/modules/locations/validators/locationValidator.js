const formatValidationErrors = (errors = {}) =>
  Object.entries(errors).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }

    return acc;
  }, {});

export const validateDepartmentCodeParams = (params = {}) => {
  const departmentCode = String(params.departmentCode || '').trim();
  const errors = formatValidationErrors({
    departmentCode:
      !departmentCode
        ? 'El codigo del departamento es obligatorio.'
        : departmentCode.length > 10
          ? 'El codigo del departamento no puede exceder 10 caracteres.'
          : null,
  });

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      data: null,
      errors,
    };
  }

  return {
    success: true,
    data: {
      departmentCode,
    },
    errors: null,
  };
};

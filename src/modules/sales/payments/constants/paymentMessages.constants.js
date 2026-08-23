export const PAYMENT_MESSAGES = {
  CREDIT_NOT_FOUND:
    "El crédito no existe",

  CREDIT_ALREADY_PAID:
    "El crédito ya se encuentra pagado",

  CREDIT_NOT_OVERDUE:
    "El crédito aún no está vencido",

  INSTALLMENT_NOT_FOUND:
    "El abono no existe",

  INSTALLMENT_ALREADY_CANCELLED:
    "El abono ya fue anulado",

  INSTALLMENT_CANCELLATION_EXPIRED:
    "El abono solo puede anularse durante las primeras 48 horas",

  USER_NOT_FOUND:
    "El usuario no existe",

  INVALID_PASSWORD:
    "Contraseña incorrecta",

  AMOUNT_EXCEEDS_DEBT:
    "El monto supera la deuda pendiente",

  INVALID_INSTALLMENT_AMOUNT:
    "El valor minimo permitido para un abono es de $10.000.",

  INVALID_POSITIVE_INSTALLMENT_AMOUNT:
    "El monto del abono debe ser mayor a cero.",

  INVALID_LOW_DEBT_INSTALLMENT_AMOUNT:
    "Cuando la deuda pendiente es inferior a $10.000, el abono debe cubrir el valor total pendiente.",

  INSUFFICIENT_FAVOR_BALANCE:
    "Saldo a favor insuficiente para registrar el abono.",

  PAYMENT_METHOD_NOT_FOUND:
    "Metodo de pago no encontrado.",

  INVALID_INSTALLMENT_PAYMENT_METHOD:
    "El metodo Credito no es valido para registrar abonos.",

  INVALID_INTEREST_PERCENTAGE:
    "El porcentaje de interes debe estar entre 1% y 99%.",

  INSTALLMENT_CREATED:
    "Abono registrado exitosamente",

  INSTALLMENT_CANCELLED:
    "Abono anulado exitosamente",

  INTEREST_CREATED:
    "Interés generado exitosamente",
};

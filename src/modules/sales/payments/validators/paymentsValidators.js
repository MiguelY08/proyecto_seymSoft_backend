import { z } from "zod";
import { PAYMENT_BUSINESS_RULES } from "../constants/paymentBusinessRules.constants.js";

/**
 * ==========================================
 * CREATE INSTALLMENT
 * ==========================================
 */
export const createInstallmentSchema = z.object({
  id_credit: z
    .number({
      required_error: "El crédito es obligatorio",
    })
    .int()
    .positive(),

  id_payment_method: z
    .number({
      required_error:
        "El método de pago es obligatorio",
    })
    .int()
    .positive(),

  installment_amount: z
    .number({
      required_error:
        "El monto es obligatorio",
    })
    .min(
      PAYMENT_BUSINESS_RULES.MIN_INSTALLMENT_AMOUNT,
      "El valor minimo permitido para un abono es de $1.000."
    ),

  observations: z
    .string()
    .trim()
    .max(
      255,
      "La observación no puede superar los 255 caracteres"
    )
    .optional()
    .nullable(),
});

/**
 * ==========================================
 * CANCEL INSTALLMENT
 * ==========================================
 */
export const cancelInstallmentSchema =
  z.object({
    id_installment: z
      .number({
        required_error:
          "El abono es obligatorio",
      })
      .int()
      .positive(),

    reason: z
      .string({
        required_error:
          "El motivo de anulación es obligatorio",
      })
      .trim()
      .min(
        10,
        "El motivo debe tener mínimo 10 caracteres"
      )
      .max(
        255,
        "El motivo no puede superar los 255 caracteres"
      ),

    password: z
      .string({
        required_error:
          "La contraseña es obligatoria",
      })
      .min(
        1,
        "La contraseña es obligatoria"
      ),
  });

/**
 * ==========================================
 * GENERATE INTEREST
 * ==========================================
 */
export const generateInterestSchema =
  z.object({
    id_credit: z
      .number({
        required_error:
          "El crédito es obligatorio",
      })
      .int()
      .positive(),

    percentage: z
      .number({
        required_error:
          "El porcentaje es obligatorio",
      })
      .int(
        "El porcentaje de interes debe estar entre 1% y 99%."
      )
      .min(
        PAYMENT_BUSINESS_RULES.MIN_INTEREST_PERCENTAGE,
        "El porcentaje de interes debe estar entre 1% y 99%."
      )
      .max(
        PAYMENT_BUSINESS_RULES.MAX_INTEREST_PERCENTAGE,
        "El porcentaje de interes debe estar entre 1% y 99%."
      ),
  });

/**
 * ==========================================
 * CUSTOMER INVOICES
 * ==========================================
 */
export const customerInvoicesSchema =
  z.object({
    id_customer: z
      .number({
        required_error:
          "El cliente es obligatorio",
      })
      .int()
      .positive(),
  });

/**
 * ==========================================
 * INVOICE INSTALLMENTS
 * ==========================================
 */
export const invoiceInstallmentsSchema =
  z.object({
    id_sale: z
      .number({
        required_error:
          "La factura es obligatoria",
      })
      .int()
      .positive(),
  });

/**
 * ==========================================
 * CUSTOMER CONTACT
 * ==========================================
 */
export const customerContactSchema =
  z.object({
    id_customer: z
      .number({
        required_error:
          "El cliente es obligatorio",
      })
      .int()
      .positive(),
  });

export const validateCreateInstallment =
  (data) =>
    createInstallmentSchema.parse(data);

export const validateCancelInstallment =
  (data) =>
    cancelInstallmentSchema.parse(data);

export const validateGenerateInterest =
  (data) =>
    generateInterestSchema.parse(data);

export const validateCustomerInvoices =
  (data) =>
    customerInvoicesSchema.parse(data);

export const validateInvoiceInstallments =
  (data) =>
    invoiceInstallmentsSchema.parse(data);

export const validateCustomerContact =
  (data) =>
    customerContactSchema.parse(data);

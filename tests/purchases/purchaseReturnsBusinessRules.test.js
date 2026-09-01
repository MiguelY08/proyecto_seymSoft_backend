import test from "node:test";
import assert from "node:assert/strict";

import {
  PURCHASE_STATUS_IDS,
  RETURN_DETAIL_STATUS_IDS,
  RETURN_LIFECYCLE,
  RETURN_METHOD_IDS,
  calculatePurchaseDetailReturnAvailability,
  calculatePurchaseDetailsReturnAvailability,
  calculatePurchaseStatusFromReturns,
  calculateReturnLifecycle,
  getAllowedNextStatuses,
  getPurchaseMaxReturnDate,
  shouldRestoreStockOnReady,
  validateDetailIsEditable,
  validateDetailStatusTransition,
  validatePurchaseReturnPeriod,
  validateReturnQuantity,
} from "../../src/modules/purchases/purchase-returns/helpers/purchaseReturnHelper.js";
import { shouldRestoreStockOnAnnul } from "../../src/modules/purchases/purchase-returns/use-cases/annular.usecase.js";
import { validateCreatePurchaseReturn } from "../../src/modules/purchases/purchase-returns/validators/create.validator.js";
import { validateAnnularPurchaseReturn } from "../../src/modules/purchases/purchase-returns/validators/annular.validator.js";
import { validateUpdatePurchaseReturn } from "../../src/modules/purchases/purchase-returns/validators/update.validator.js";
import { PurchaseReturnMapper } from "../../src/modules/purchases/purchase-returns/mappers/purchaseReturnMapper.js";

test("validatePurchaseReturnPeriod permite devolucion hasta la fecha maxima calculada", () => {
  const purchase = {
    purchase_date: new Date(2026, 0, 10),
    max_return_date: null,
    providers: {
      max_return_period: 15,
    },
  };

  const maxReturnDate = getPurchaseMaxReturnDate(purchase);
  const result = validatePurchaseReturnPeriod(
    purchase,
    new Date(2026, 0, 25),
  );

  assert.equal(maxReturnDate.getDate(), 25);
  assert.equal(result.success, true);
  assert.equal(result.meta.maxReturnDate.getDate(), 25);
});

test("validatePurchaseReturnPeriod rechaza devoluciones fuera del periodo", () => {
  const result = validatePurchaseReturnPeriod(
    {
      purchase_date: new Date(2026, 0, 10),
      max_return_date: new Date(2026, 0, 20),
      providers: {
        max_return_period: 10,
      },
    },
    new Date(2026, 0, 21),
  );

  assert.equal(result.success, false);
  assert.equal(result.errorCode, "PURCHASE_RETURN_PERIOD_EXPIRED");
});

test("calculatePurchaseDetailReturnAvailability descuenta reservas y devoluciones finales", () => {
  const result = calculatePurchaseDetailReturnAvailability({
    purchasedQuantity: 10,
    returnDetails: [
      {
        quantity: 2,
        id_return_status: RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
        id_return_method: RETURN_METHOD_IDS.REPLACEMENT,
      },
      {
        quantity: 3,
        id_return_status: RETURN_DETAIL_STATUS_IDS.READY,
        id_return_method: RETURN_METHOD_IDS.REFUND,
      },
      {
        quantity: 4,
        id_return_status: RETURN_DETAIL_STATUS_IDS.ANNULLED,
        id_return_method: RETURN_METHOD_IDS.REFUND,
      },
    ],
  });

  assert.deepEqual(result, {
    purchasedQuantity: 10,
    reservedQuantity: 2,
    finalReturnedQuantity: 3,
    availableQuantity: 5,
  });
});

test("calculatePurchaseDetailsReturnAvailability usa stock_added para compras por paca", () => {
  const result = calculatePurchaseDetailsReturnAvailability({
    purchaseDetails: [
      {
        id_purchase_detail: 7,
        quantity: 2,
        stock_added: 24,
      },
    ],
    returnDetails: [
      {
        id_purchase_detail: 7,
        quantity: 5,
        id_return_status: RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
        id_return_method: RETURN_METHOD_IDS.REPLACEMENT,
      },
    ],
  });

  assert.equal(result.get(7).purchasedQuantity, 24);
  assert.equal(result.get(7).reservedQuantity, 5);
  assert.equal(result.get(7).availableQuantity, 19);
});

test("validateReturnQuantity rechaza cantidades invalidas o superiores a disponible", () => {
  const invalid = validateReturnQuantity({
    requestedQuantity: 0,
    purchasedQuantity: 10,
  });
  const exceeded = validateReturnQuantity({
    requestedQuantity: 8,
    purchasedQuantity: 10,
    returnedQuantity: 4,
  });
  const valid = validateReturnQuantity({
    requestedQuantity: 6,
    purchasedQuantity: 10,
    returnedQuantity: 4,
  });

  assert.equal(invalid.errorCode, "INVALID_RETURN_QUANTITY");
  assert.equal(exceeded.errorCode, "RETURN_QUANTITY_EXCEEDED");
  assert.equal(exceeded.availableQuantity, 6);
  assert.equal(valid.success, true);
});

test("validateDetailStatusTransition respeta flujo segun metodo de devolucion", () => {
  assert.deepEqual(
    getAllowedNextStatuses(
      RETURN_METHOD_IDS.REPLACEMENT,
      RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
    ),
    [RETURN_DETAIL_STATUS_IDS.PENDING_REPLACEMENT],
  );

  const valid = validateDetailStatusTransition({
    idReturnMethod: RETURN_METHOD_IDS.REFUND,
    idReturnReason: 8,
    currentStatusId: RETURN_DETAIL_STATUS_IDS.PENDING_REFUND,
    nextStatusId: RETURN_DETAIL_STATUS_IDS.SUPPLIER_REJECTION,
  });
  const invalidReason = validateDetailStatusTransition({
    idReturnMethod: RETURN_METHOD_IDS.REFUND,
    idReturnReason: 10,
    currentStatusId: RETURN_DETAIL_STATUS_IDS.PENDING_REFUND,
    nextStatusId: RETURN_DETAIL_STATUS_IDS.SUPPLIER_REJECTION,
  });
  const invalidFlow = validateDetailStatusTransition({
    idReturnMethod: RETURN_METHOD_IDS.CREDIT_BALANCE,
    idReturnReason: 8,
    currentStatusId: RETURN_DETAIL_STATUS_IDS.PENDING_REFUND,
    nextStatusId: RETURN_DETAIL_STATUS_IDS.SUPPLIER_REJECTION,
  });

  assert.equal(valid.success, true);
  assert.equal(
    invalidReason.errorCode,
    "SUPPLIER_REJECTION_REASON_NOT_ALLOWED",
  );
  assert.equal(invalidFlow.errorCode, "INVALID_RETURN_STATUS_FLOW");
});

test("reglas de restauracion de stock distinguen reemplazo listo y anulacion", () => {
  assert.equal(
    shouldRestoreStockOnReady({
      idReturnMethod: RETURN_METHOD_IDS.REPLACEMENT,
      currentStatusId: RETURN_DETAIL_STATUS_IDS.PENDING_REPLACEMENT,
      nextStatusId: RETURN_DETAIL_STATUS_IDS.READY,
    }),
    true,
  );
  assert.equal(
    shouldRestoreStockOnAnnul({
      id_return_method: RETURN_METHOD_IDS.REPLACEMENT,
      id_return_status: RETURN_DETAIL_STATUS_IDS.READY,
    }),
    false,
  );
  assert.equal(
    shouldRestoreStockOnAnnul({
      id_return_method: RETURN_METHOD_IDS.REFUND,
      id_return_status: RETURN_DETAIL_STATUS_IDS.PENDING_REFUND,
    }),
    true,
  );
});

test("calculateReturnLifecycle y calculatePurchaseStatusFromReturns resumen avance", () => {
  assert.equal(
    calculateReturnLifecycle({
      details: [
        { id_return_status: RETURN_DETAIL_STATUS_IDS.READY },
        { id_return_status: RETURN_DETAIL_STATUS_IDS.SUPPLIER_REJECTION },
      ],
    }),
    RETURN_LIFECYCLE.COMPLETED,
  );

  assert.equal(
    calculatePurchaseStatusFromReturns([
      {
        lifecycle: RETURN_LIFECYCLE.IN_PROCESS,
      },
      {
        lifecycle: RETURN_LIFECYCLE.ANNULLED,
      },
    ]),
    PURCHASE_STATUS_IDS.RETURN_IN_PROCESS_WITH_ANNULLED_RETURNS,
  );
});

test("validateDetailIsEditable bloquea detalles listos o rechazados por proveedor", () => {
  assert.equal(
    validateDetailIsEditable({
      id_return_status: RETURN_DETAIL_STATUS_IDS.READY,
    }).errorCode,
    "RETURN_DETAIL_ALREADY_READY",
  );
  assert.equal(
    validateDetailIsEditable({
      id_return_status: RETURN_DETAIL_STATUS_IDS.SUPPLIER_REJECTION,
    }).errorCode,
    "RETURN_DETAIL_SUPPLIER_REJECTED",
  );
  assert.equal(
    validateDetailIsEditable({
      id_return_status: RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
    }).success,
    true,
  );
});

test("validadores de devoluciones en compras normalizan ids y rechazan cuerpos vacios", () => {
  const createResult = validateCreatePurchaseReturn({
    body: {
      idPurchase: "12",
      details: [
        {
          idPurchaseDetail: "7",
          quantity: "2",
          idReturnReason: "8",
          idReturnMethod: "1",
          idReturnStatus: "1",
          supplierDate: "2026-01-20",
        },
      ],
    },
  });
  const annulResult = validateAnnularPurchaseReturn({
    params: { id: "9" },
    body: { cancellationReason: "Error en registro" },
  });
  const updateEmptyResult = validateUpdatePurchaseReturn({
    params: { id: "9" },
    body: {},
  });

  assert.equal(createResult.success, true);
  assert.equal(createResult.data.idPurchase, 12);
  assert.equal(createResult.data.details[0].quantity, 2);
  assert.equal(annulResult.success, true);
  assert.equal(annulResult.data.idPurchaseReturn, 9);
  assert.equal(updateEmptyResult.success, false);
  assert.match(updateEmptyResult.errors["body.general"], /al menos un detalle/);
});

test("PurchaseReturnMapper.toDetailResponse incluye progreso, compra y auditoria", () => {
  const response = PurchaseReturnMapper.toDetailResponse({
    id_purchase_return: 50,
    id_purchase: 12,
    creation_date: new Date(2026, 0, 20),
    id_return_status: RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
    return_statuses: {
      id_return_status: RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
      name_status: "Pend. envio",
    },
    purchases: {
      id_purchase: 12,
      invoice_number: "FAC-001",
      purchase_date: new Date(2026, 0, 10),
      max_return_date: new Date(2026, 0, 25),
      total_amount: 119000,
      id_purchase_status: PURCHASE_STATUS_IDS.RETURN_IN_PROCESS,
      purchase_statuses: {
        name_puchase_status: "Proc. devolucion",
      },
      providers: {
        id_provider: 5,
        name_provider: "Proveedor Demo",
        max_return_period: 15,
      },
    },
    prd: [
      {
        id_purchase_return_details: 1,
        id_purchase_return: 50,
        id_purchase_detail: 7,
        barcode: "MAIN-001",
        quantity: 2,
        id_return_reason: 8,
        id_return_method: RETURN_METHOD_IDS.REFUND,
        id_return_status: RETURN_DETAIL_STATUS_IDS.READY,
        products: {
          id_product: 10,
          name: "Producto prueba",
          reference: "REF-001",
        },
        return_reasons: {
          description: "MAL_ESTADO",
        },
        return_methods: {
          description: "Reembolso",
        },
        return_statuses: {
          name_status: "Listo",
        },
        purchase_details: {
          id_barcode: 22,
          barcodes: {
            stock: 5,
          },
        },
      },
    ],
    hsp: [],
    purchase_return_audit_logs: [
      {
        id_purchase_return_audit_log: 99,
        id_purchase_return: 50,
        id_user: 3,
        action: "ANNUL_PURCHASE_RETURN",
        previous_return_status: 1,
        new_return_status: 5,
        reason: "Error en registro",
        metadata: { idPurchase: 12 },
        created_at: new Date(2026, 0, 21),
        users: {
          id_user: 3,
          full_name: "Admin Demo",
          email: "admin@example.com",
        },
      },
    ],
  });

  assert.equal(response.id, 50);
  assert.deepEqual(response.progress, {
    completed: 1,
    total: 1,
    label: "1/1",
  });
  assert.equal(response.purchase.invoiceNumber, "FAC-001");
  assert.equal(response.details[0].method, "Reembolso");
  assert.equal(response.auditLogs[0].user.name, "Admin Demo");
});


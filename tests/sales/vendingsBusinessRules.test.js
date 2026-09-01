import test from "node:test";
import assert from "node:assert/strict";

import {
  validateCreateVending,
  validateCreateVendingParams,
} from "../../src/modules/sales/vendings/validators/create.validator.js";
import {
  validateAnnularVending,
  validateAnnularVendingParams,
} from "../../src/modules/sales/vendings/validators/annular.validator.js";
import {
  validateUpdateVending,
  validateUpdateVendingParams,
} from "../../src/modules/sales/vendings/validators/update.validator.js";
import { VendingMapper } from "../../src/modules/sales/vendings/mappers/vendingMapper.js";

const validCreatePayload = {
  order: {
    idClient: 7,
    idOrderStatus: 1,
    deliveryType: "Recoge",
    items: [
      {
        idProduct: 3,
        barcode: "ABC123",
        quantity: 2,
      },
    ],
  },
  idEmployee: 4,
  idSaleStatus: 1,
  paymentMethods: [
    {
      idPaymentMethod: 2,
      amount: 50000,
    },
  ],
};

test("validateCreateVendingParams acepta tipos de venta permitidos y normaliza a minuscula", () => {
  const manualResult = validateCreateVendingParams({ vendingType: "MANUAL" });
  const directResult = validateCreateVendingParams({ vendingType: "direct" });
  const webResult = validateCreateVendingParams({ vendingType: "web" });

  assert.equal(manualResult.success, true);
  assert.equal(manualResult.data.vendingType, "manual");
  assert.equal(directResult.success, true);
  assert.equal(webResult.success, true);
});

test("validateCreateVendingParams rechaza tipos de venta desconocidos", () => {
  const result = validateCreateVendingParams({ vendingType: "credito" });

  assert.equal(result.success, false);
  assert.match(result.errors.vendingType, /manual, direct, web/);
});

test("validateCreateVending rechaza metodos de pago repetidos en la misma venta", () => {
  const result = validateCreateVending({
    ...validCreatePayload,
    paymentMethods: [
      { idPaymentMethod: 2, amount: 25000 },
      { idPaymentMethod: 2, amount: 25000 },
    ],
  });

  assert.equal(result.success, false);
  assert.match(result.errors.paymentMethods, /No se pueden repetir/);
});

test("validateCreateVending exige datos de credito cuando el metodo de pago es credito", () => {
  const result = validateCreateVending({
    ...validCreatePayload,
    paymentMethods: [
      {
        idPaymentMethod: 3,
        amount: 50000,
      },
    ],
  });

  assert.equal(result.success, false);
  assert.match(result.errors.credit, /Debe enviar los datos del credito/);
});

test("validateCreateVending rechaza datos de credito si no se usa metodo de pago credito", () => {
  const result = validateCreateVending({
    ...validCreatePayload,
    credit: {
      dueDate: "2026-09-30",
      idCreditStatus: 1,
    },
  });

  assert.equal(result.success, false);
  assert.match(result.errors.credit, /No debe enviar datos de credito/);
});

test("validateCreateVending exige direccion, ubicacion y envio para ventas a domicilio", () => {
  const result = validateCreateVending({
    ...validCreatePayload,
    order: {
      ...validCreatePayload.order,
      deliveryType: "Domicilio",
      shippingAmount: 0,
    },
  });

  assert.equal(result.success, false);
  assert.match(result.errors["order.deliveryAddress"], /direccion de entrega/);
  assert.match(result.errors["order.shippingAmount"], /envio debe ser mayor/);
  assert.match(result.errors["order.deliveryDepartmentCode"], /departamento de entrega/);
  assert.match(result.errors["order.deliveryCityCode"], /municipio o ciudad/);
});

test("validateUpdateVending rechaza actualizacion vacia y exige direccion para domicilio", () => {
  const emptyResult = validateUpdateVending({});
  const deliveryResult = validateUpdateVending({
    deliveryType: "Domicilio",
  });

  assert.equal(emptyResult.success, false);
  assert.match(emptyResult.errors.general, /modificar al menos un campo/);
  assert.equal(deliveryResult.success, false);
  assert.match(deliveryResult.errors.deliveryAddress, /obligatoria/);
});

test("validadores de anulacion aceptan id positivo y motivo obligatorio", () => {
  const validParams = validateAnnularVendingParams({ id: "12" });
  const invalidParams = validateAnnularVendingParams({ id: "0" });
  const validBody = validateAnnularVending({
    annulmentReason: "Cliente cancela la compra",
  });
  const invalidBody = validateAnnularVending({
    annulmentReason: "",
  });

  assert.equal(validParams.success, true);
  assert.equal(validParams.data.id, 12);
  assert.equal(invalidParams.success, false);
  assert.equal(validBody.success, true);
  assert.equal(invalidBody.success, false);
});

test("validateUpdateVendingParams convierte el id de texto a numero positivo", () => {
  const result = validateUpdateVendingParams({ id: "15" });

  assert.equal(result.success, true);
  assert.equal(result.data.id, 15);
});

test("VendingMapper.toResponse conserva datos clave de venta, pedido y pago", () => {
  const sale = VendingMapper.toDomain({
    id_sale: 21,
    id_order: 31,
    id_employe: 4,
    subtotal: "50000",
    id_sale_status: 1,
    id_sale_type: 1,
    sale_date: new Date(2026, 7, 30),
    sale_statuses: {
      id_sale_status: 1,
      name_status: "Aprobada",
      description: "Venta aprobada",
    },
    sale_types: {
      id_sale_type: 1,
      sale_type_name: "manual",
    },
    sale_payment_methods: [
      {
        id_sale_payment_method: 9,
        id_sale: 21,
        id_payment_method: 2,
        amount: "50000",
        creation_date: new Date(2026, 7, 30),
        payment_methods: {
          id_payment_method: 2,
          name_payment_method: "Efectivo",
        },
      },
    ],
    sales_orders: {
      id_order: 31,
      id_customer: 7,
      id_order_status: 3,
      delivery_type: "Recoge",
      delivery_adress: "El cliente lo recoge",
      subtotal: "50000",
      iva_amount: "0",
      shipping_amount: "0",
      total: "50000",
      payment_status: "Pagado",
      sale_type: "manual",
      clients: {
        id_client: 7,
        person_type: "natural",
        client_type: "detal",
        users: {
          id_user: 18,
          full_name: "Cliente Demo",
          email: "cliente@example.com",
          phone: 3001234567n,
        },
      },
      order_statuses: {
        id_order_status: 3,
        name_status: "Entregado",
        description: "Pedido entregado",
      },
      order_payments: [],
      order_details: [],
    },
  });

  const response = VendingMapper.toResponse(sale);

  assert.equal(response.id, 21);
  assert.equal(response.total, 50000);
  assert.equal(response.paymentMethods[0].paymentMethod.namePaymentMethod, "Efectivo");
  assert.equal(response.status.nameStatus, "Aprobada");
  assert.equal(response.type.saleTypeName, "manual");
  assert.equal(response.order.customer.user.phone, "3001234567");
  assert.equal(response.order.shippingStatus, "No aplica");
});

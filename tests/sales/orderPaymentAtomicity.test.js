import test from 'node:test';
import assert from 'node:assert/strict';

import { RegisterOrderPaymentUseCase } from '../../src/modules/sales/orders/use-cases/registerOrderPaymentUseCase.js';
import { createVendingUseCase } from '../../src/modules/sales/vendings/use-cases/create.usecase.js';
import { VendingRepository } from '../../src/modules/sales/vendings/repositories/vendingRepository.js';

const PAYMENT_STATUSES = {
  PENDING: 1,
  PAID: 2,
};

const createPartialPaymentRepository = ({ failUpdatingStatus = false } = {}) => {
  const state = {
    payments: [],
    paymentStatus: PAYMENT_STATUSES.PENDING,
  };

  return {
    state,
    async findPaymentStateById() {
      return {
        id_order: 91,
        id_order_status: 1,
        id_payment_status: state.paymentStatus,
        total: 100,
        order_payments: [...state.payments],
        clients: { credit_balance: 0 },
        sales: null,
      };
    },
    async findPaymentMethodById(idPaymentMethod) {
      return {
        id_payment_method: idPaymentMethod,
        name_payment_method: 'Efectivo',
      };
    },
    async registerPartialPayment(_idOrder, payment) {
      // Simula el commit de una transacción: el estado sólo se publica cuando
      // todas las escrituras internas han terminado correctamente.
      const nextState = {
        payments: [...state.payments, { amount: payment.amount }],
        paymentStatus: PAYMENT_STATUSES.PENDING,
      };

      if (failUpdatingStatus) {
        throw new Error('Fallo inyectado al actualizar el estado de pago');
      }

      Object.assign(state, nextState);
    },
    async findPaymentResultById() {
      return {
        id_order: 91,
        id_payment_status: state.paymentStatus,
        payment_status: 'Pendiente',
        total: 100,
        order_payments: state.payments.map((payment, index) => ({
          id_order_payment: index + 1,
          id_payment_method: 1,
          ...payment,
        })),
      };
    },
  };
};

test('contrato: un fallo al confirmar un pago parcial revierte el pago y el estado', async () => {
  const repo = createPartialPaymentRepository({ failUpdatingStatus: true });
  const useCase = new RegisterOrderPaymentUseCase(repo);

  await assert.rejects(
    () => useCase.execute(91, { idPaymentMethod: 1, amount: 25 }),
    /Fallo inyectado al actualizar el estado de pago/,
  );

  assert.deepEqual(repo.state, {
    payments: [],
    paymentStatus: PAYMENT_STATUSES.PENDING,
  });
});

test('control: un pago parcial exitoso conserva el estado pendiente', async () => {
  const repo = createPartialPaymentRepository();
  const useCase = new RegisterOrderPaymentUseCase(repo);

  const result = await useCase.execute(91, {
    idPaymentMethod: 1,
    amount: 25,
  });

  assert.equal(result.paymentSummary.isPaid, false);
  assert.deepEqual(repo.state, {
    payments: [{ amount: 25 }],
    paymentStatus: PAYMENT_STATUSES.PENDING,
  });
});

test('contrato: recuperación delega venta y estado Pagado a la misma operación transaccional', async () => {
  const originalMethods = {
    findSaleTypeByName: VendingRepository.findSaleTypeByName,
    findEmployeeByUserId: VendingRepository.findEmployeeByUserId,
    findEmployeeById: VendingRepository.findEmployeeById,
    findSaleStatusById: VendingRepository.findSaleStatusById,
    findOrderById: VendingRepository.findOrderById,
    validateStockForOrder: VendingRepository.validateStockForOrder,
    findPaymentMethodById: VendingRepository.findPaymentMethodById,
    create: VendingRepository.create,
  };
  let receivedSaleData = null;
  const originalConsoleError = console.error;

  try {
    console.error = () => {};
    VendingRepository.findSaleTypeByName = async () => ({ id_sale_type: 3 });
    VendingRepository.findEmployeeByUserId = async () => null;
    VendingRepository.findEmployeeById = async () => ({ id_employee: 5 });
    VendingRepository.findSaleStatusById = async () => ({ id_sale_status: 1 });
    VendingRepository.findOrderById = async () => ({
      id_order: 91,
      id_customer: 7,
      id_order_status: 1,
      sales: null,
      total: 100,
      subtotal: 100,
      order_details: [{ id_product: 4, barcode: 'ABC', quantity: 1, subtotal: 100 }],
    });
    VendingRepository.validateStockForOrder = async () => ({ success: true });
    VendingRepository.findPaymentMethodById = async () => ({ id_payment_method: 1 });
    VendingRepository.create = async (saleData) => {
      receivedSaleData = saleData;
      throw new Error('Fallo inyectado dentro de la transacción de venta');
    };

    const result = await createVendingUseCase({
      vendingType: 'manual',
      idEmployee: 5,
      source: 'paid-order',
      data: {
        idOrder: 91,
        idSaleStatus: 1,
        paymentMethods: [{ idPaymentMethod: 1, amount: 100 }],
        markOrderAsPaid: true,
      },
    });

    assert.equal(result.success, false);
    assert.equal(receivedSaleData.markOrderAsPaid, true);
    assert.equal(receivedSaleData.decreaseStock, true);
  } finally {
    Object.assign(VendingRepository, originalMethods);
    console.error = originalConsoleError;
  }
});
test.todo('contrato: aprobar comprobante revierte pago o venta si no puede aprobar el comprobante');
test.todo('contrato: rechazar comprobante revierte el nuevo plazo si no puede rechazar el comprobante');
test.todo('contrato: venta directa revierte pedido, saldo a favor, venta, crédito y stock ante cualquier fallo');

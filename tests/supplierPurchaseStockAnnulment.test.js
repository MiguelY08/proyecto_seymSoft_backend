import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPurchaseStockReverts,
  decrementPurchaseStockAtomically,
} from '../src/modules/purchases/supplierPurchases/repositories/supplierPurchaseRepository.js';

test('annulment reverses only the barcode recorded by each purchase detail', () => {
  const result = buildPurchaseStockReverts([{ id_barcode: 56, stock_added: 5 }]);
  assert.deepEqual(result, [{ idBarcode: 56, quantity: 5 }]);
});

test('annulment groups repeated details for the same barcode', () => {
  const result = buildPurchaseStockReverts([
    { id_barcode: 59, stock_added: 2 },
    { id_barcode: 59, quantity: 3, stock_added: null },
  ]);
  assert.deepEqual(result, [{ idBarcode: 59, quantity: 5 }]);
});

test('annulment rejects insufficient stock without auditing a movement', async () => {
  let movementCreated = false;
  const tx = {
    barcodes: {
      findUnique: async () => ({ stock: 1, barcode: '1023634446' }),
      updateMany: async () => ({ count: 0 }),
    },
    inventory_stock_movements: {
      create: async () => { movementCreated = true; },
    },
  };

  await assert.rejects(
    decrementPurchaseStockAtomically(tx, [{ idBarcode: 59, quantity: 2 }], 40),
    (error) => error.statusCode === 409 && error.message.includes('1023634446')
  );
  assert.equal(movementCreated, false);
});

test('annulment audits the exact stock before and after', async () => {
  let reads = 0;
  let movement;
  const tx = {
    barcodes: {
      findUnique: async () => (++reads === 1 ? { stock: 7, barcode: 'ABC' } : { stock: 4 }),
      updateMany: async () => ({ count: 1 }),
    },
    inventory_stock_movements: {
      create: async ({ data }) => { movement = data; },
    },
  };

  await decrementPurchaseStockAtomically(tx, [{ idBarcode: 10, quantity: 3 }], 99);
  assert.equal(movement.stock_before, 7);
  assert.equal(movement.stock_after, 4);
  assert.equal(movement.quantity_delta, -3);
  assert.equal(movement.reference_id, 99);
});

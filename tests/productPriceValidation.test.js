import assert from 'node:assert/strict';
import test from 'node:test';
import { validateProductPrices } from '../src/modules/purchases/products/use-cases/productPriceValidation.js';

test('optional empty prices remain valid', () => {
  assert.doesNotThrow(() => validateProductPrices({
    supplierPrice: null,
    retailPrice: 0,
    wholesalePrice: 0,
    partnerPrice: 0,
    bulkPrice: 0,
  }));
});

test('each sale price rejects a value equal to or below supplier price', () => {
  const fields = ['retailPrice', 'wholesalePrice', 'partnerPrice', 'bulkPrice'];
  for (const field of fields) {
    assert.throws(
      () => validateProductPrices({ supplierPrice: 100, [field]: 100 }),
      (error) => error.statusCode === 400 && error.message.includes('proveedor')
    );
    assert.throws(
      () => validateProductPrices({ supplierPrice: 100, [field]: 99 }),
      (error) => error.statusCode === 400 && error.message.includes('proveedor')
    );
  }
});

test('sale prices above supplier price are valid', () => {
  assert.doesNotThrow(() => validateProductPrices({
    supplierPrice: 70,
    retailPrice: 100,
    wholesalePrice: 90,
    partnerPrice: 80,
    bulkPrice: 80,
  }));
});

test('bulk price cannot exceed partner price', () => {
  assert.throws(
    () => validateProductPrices({ partnerPrice: 80, bulkPrice: 81 }),
    (error) => error.statusCode === 400 && error.message.includes('precio colegas')
  );
});

test('bulk price equal to partner price is valid', () => {
  assert.doesNotThrow(() => validateProductPrices({ partnerPrice: 80, bulkPrice: 80 }));
});

test('the complete sale price hierarchy is enforced', () => {
  assert.throws(
    () => validateProductPrices({ retailPrice: 100, wholesalePrice: 100 }),
    (error) => error.statusCode === 400 && error.message.includes('mayorista')
  );
  assert.throws(
    () => validateProductPrices({ wholesalePrice: 90, partnerPrice: 91 }),
    (error) => error.statusCode === 400 && error.message.includes('colegas')
  );
});

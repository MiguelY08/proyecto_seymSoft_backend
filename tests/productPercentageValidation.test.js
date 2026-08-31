import assert from 'node:assert/strict';
import test from 'node:test';
import { CreateProductDto } from '../src/modules/purchases/products/dtos/createProduct.dto.js';
import { UpdateProductDto } from '../src/modules/purchases/products/dtos/updateProduct.dto.js';
import { validateProductPercentages } from '../src/modules/purchases/products/use-cases/productPercentageValidation.js';

const percentageFields = [
  'ivaPercentage',
  'retailDiscountPct',
  'wholesaleDiscountPct',
  'partnerDiscountPct',
  'bulkDiscountPct',
];

test('IVA and discounts accept the inclusive 0 to 100 range', () => {
  for (const field of percentageFields) {
    assert.doesNotThrow(() => validateProductPercentages({ [field]: 0 }));
    assert.doesNotThrow(() => validateProductPercentages({ [field]: 100 }));
  }
});

test('IVA and discounts reject values above 100 and below 0', () => {
  for (const field of percentageFields) {
    assert.throws(() => validateProductPercentages({ [field]: 101 }), (error) => error.statusCode === 400);
    assert.throws(() => validateProductPercentages({ [field]: -1 }), (error) => error.statusCode === 400);
  }
});

test('create and update DTOs enforce percentage limits', () => {
  assert.throws(
    () => new CreateProductDto({ ivaPercentage: 101 }),
    (error) => error.statusCode === 400
  );
  assert.throws(
    () => new UpdateProductDto({ bulkDiscountPct: 101 }),
    (error) => error.statusCode === 400
  );
});

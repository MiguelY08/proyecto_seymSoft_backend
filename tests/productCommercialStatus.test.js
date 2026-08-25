import assert from 'node:assert/strict';
import test from 'node:test';
import { CreateProductDto } from '../src/modules/purchases/products/dtos/createProduct.dto.js';
import { UpdateProductDto } from '../src/modules/purchases/products/dtos/updateProduct.dto.js';
import { ToggleProductStatusUseCase } from '../src/modules/purchases/products/use-cases/toggleProductStatusUseCase.js';
import {
  getMissingSalePrices,
  hasCompleteSalePrices,
} from '../src/modules/purchases/products/use-cases/productCommercialStatus.js';

const baseProduct = {
  nombre: 'Producto prueba',
  referencia: 'REF-TEST',
  idUnitMeasure: 1,
  idCategorie: 1,
  codBarras: 'TEST-123',
};

test('a product created without all sale prices is forced inactive', () => {
  const dto = new CreateProductDto({ ...baseProduct, precioDetalle: 100, precioMayorista: 90 });
  assert.equal(dto.idStatus, 2);
});

test('a product with all positive sale prices can be created active', () => {
  const dto = new CreateProductDto({
    ...baseProduct,
    precioDetalle: 100,
    precioMayorista: 90,
    precioColegas: 80,
    precioPacas: 70,
  });
  assert.equal(dto.idStatus, 1);
});

test('supplier price is not required for commercial publication', () => {
  assert.equal(hasCompleteSalePrices({
    retail_price: 100,
    wholesale_price: 90,
    partner_price: 80,
    bulk_price: 70,
    precio_proveedor: null,
  }), true);
});

test('missing price labels identify what must be completed', () => {
  assert.deepEqual(getMissingSalePrices({
    retail_price: 100,
    wholesale_price: 0,
    partner_price: null,
    bulk_price: 70,
  }), ['precio mayorista', 'precio colegas']);
});

test('an incomplete inactive product cannot be activated manually', async () => {
  let toggled = false;
  const useCase = new ToggleProductStatusUseCase({
    findById: async () => ({
      general_statuses: { id_status: 2 },
      retail_price: 100,
      wholesale_price: 90,
      partner_price: 0,
      bulk_price: 70,
    }),
    toggleStatus: async () => { toggled = true; },
  });

  await assert.rejects(
    useCase.execute(1),
    (error) => error.statusCode === 409 && error.message.includes('precio colegas')
  );
  assert.equal(toggled, false);
});

test('product reference accepts up to 50 characters when creating and editing', () => {
  const reference = 'R'.repeat(50);
  assert.equal(new CreateProductDto({ ...baseProduct, referencia: reference }).reference, reference);
  assert.equal(new UpdateProductDto({ referencia: reference }).reference, reference);
});

test('product reference rejects more than 50 characters when creating and editing', () => {
  const reference = 'R'.repeat(51);
  assert.throws(
    () => new CreateProductDto({ ...baseProduct, referencia: reference }),
    (error) => error.statusCode === 400
  );
  assert.throws(
    () => new UpdateProductDto({ referencia: reference }),
    (error) => error.statusCode === 400
  );
});

test('product barcodes accept a maximum of 13 characters when creating and editing', () => {
  const barcode = '1234567890123';
  const created = new CreateProductDto({ ...baseProduct, codBarras: barcode });
  const updated = new UpdateProductDto({ codBarras: barcode, stock: 0 });
  assert.equal(created.barcodes[0].barcode, barcode);
  assert.equal(updated.barcodes[0].barcode, barcode);
});

test('product barcodes reject more than 13 characters when creating and editing', () => {
  const barcode = '12345678901234';
  assert.throws(
    () => new CreateProductDto({ ...baseProduct, codBarras: barcode }),
    (error) => error.statusCode === 400 && error.message.includes('13')
  );
  assert.throws(
    () => new UpdateProductDto({ codBarras: barcode, stock: 0 }),
    (error) => error.statusCode === 400 && error.message.includes('13')
  );
});

test('additional barcodes also reject more than 13 characters', () => {
  assert.throws(
    () => new CreateProductDto({
      ...baseProduct,
      barcodes: [
        { barcode: '12345678', stock: 0 },
        { barcode: '12345678901234', stock: 0 },
      ],
    }),
    (error) => error.statusCode === 400
  );
});

import test from "node:test";
import assert from "node:assert/strict";

import { CreateProductDto } from "../../src/modules/purchases/products/dtos/createProduct.dto.js";
import { UpdateProductDto } from "../../src/modules/purchases/products/dtos/updateProduct.dto.js";
import { CreateProductUseCase } from "../../src/modules/purchases/products/use-cases/createProductUseCase.js";
import { UpdateProductUseCase } from "../../src/modules/purchases/products/use-cases/updateProductUseCase.js";
import { DeleteProductUseCase } from "../../src/modules/purchases/products/use-cases/deleteProductUseCase.js";
import { mapProduct } from "../../src/modules/purchases/products/mappers/productMapper.js";

const validProductDto = new CreateProductDto({
  nombre: "Producto prueba",
  referencia: "REF-PROD-001",
  precioDetalle: 12000,
  precioMayorista: 10000,
  precioColegas: 9000,
  precioPacas: 8000,
  idUnitMeasure: 1,
  idCategorie: 1,
  codBarras: "12345678",
  stock: 5,
});

const productFromDatabase = {
  id_product: 30,
  name: "Producto prueba",
  reference: "REF-PROD-001",
  retail_price: 12000,
  wholesale_price: 10000,
  partner_price: 9000,
  bulk_price: 8000,
  precio_proveedor: 6000,
  retail_discount_pct: 0,
  wholesale_discount_pct: 0,
  partner_discount_pct: 0,
  bulk_discount_pct: 0,
  iva_percentage: 19,
  description: "Producto de prueba",
  quantity_per_pack: 0,
  unit_measures: {
    id_unit_measure: 1,
    name_unit_measure: "Unidad",
    abbreviation: "UND",
  },
  general_statuses: {
    id_status: 1,
    name_status: "Activo",
  },
  categories: {
    id_category: 1,
    category_name: "Categoria prueba",
  },
  barcodes: [
    {
      id_barcode: 1,
      barcode: "12345678",
      barcode_type: "EAN13",
      stock: 5,
    },
  ],
  product_images: [],
  product_categories: [],
  product_subcategories: [],
};

const createRepo = (overrides = {}) => ({
  findUnitMeasureById: async () => ({ id_unit_measure: 1 }),
  findCategoryById: async () => ({ id_category: 1 }),
  findStatusById: async () => ({ id_status: 1 }),
  findByReference: async () => null,
  findByBarcode: async () => null,
  create: async () => ({ id_product: 30 }),
  findById: async () => productFromDatabase,
  update: async () => productFromDatabase,
  delete: async () => undefined,
  ...overrides,
});

test("CreateProductUseCase rechaza unidad de medida inexistente antes de crear", async () => {
  let createWasCalled = false;
  const useCase = new CreateProductUseCase(
    createRepo({
      findUnitMeasureById: async () => null,
      create: async () => {
        createWasCalled = true;
      },
    }),
  );

  await assert.rejects(
    () => useCase.execute(validProductDto),
    (error) => error.statusCode === 400 && error.message.includes("unidad de medida"),
  );
  assert.equal(createWasCalled, false);
});

test("CreateProductUseCase rechaza referencia duplicada", async () => {
  const useCase = new CreateProductUseCase(
    createRepo({
      findByReference: async () => ({ id_product: 99 }),
    }),
  );

  await assert.rejects(
    () => useCase.execute(validProductDto),
    (error) => error.statusCode === 409 && error.message.includes("referencia"),
  );
});

test("CreateProductUseCase rechaza codigo de barras duplicado", async () => {
  const useCase = new CreateProductUseCase(
    createRepo({
      findByBarcode: async () => ({ id_barcode: 12 }),
    }),
  );

  await assert.rejects(
    () => useCase.execute(validProductDto),
    (error) => error.statusCode === 409 && error.message.includes("codigo de barras"),
  );
});

test("CreateProductUseCase crea producto valido y devuelve respuesta mapeada", async () => {
  let receivedDto = null;
  const useCase = new CreateProductUseCase(
    createRepo({
      create: async (dto) => {
        receivedDto = dto;
        return { id_product: 30 };
      },
    }),
  );

  const result = await useCase.execute(validProductDto);

  assert.equal(receivedDto.reference, "REF-PROD-001");
  assert.equal(result.id, 30);
  assert.equal(result.totalStock, 5);
  assert.equal(result.unitMeasure.abbreviation, "UND");
  assert.equal(result.status, "Activo");
});

test("UpdateProductUseCase rechaza producto inexistente", async () => {
  const useCase = new UpdateProductUseCase(
    createRepo({
      findById: async () => null,
    }),
  );

  await assert.rejects(
    () => useCase.execute(999, new UpdateProductDto({ nombre: "Actualizado" })),
    (error) => error.statusCode === 404 && error.message.includes("Producto no encontrado"),
  );
});

test("UpdateProductUseCase valida codigo de barras duplicado excluyendo el producto actual", async () => {
  let checkedProductId = null;
  const useCase = new UpdateProductUseCase(
    createRepo({
      findByBarcode: async (_barcode, id) => {
        checkedProductId = id;
        return { id_barcode: 77 };
      },
    }),
  );

  await assert.rejects(
    () =>
      useCase.execute(
        30,
        new UpdateProductDto({
          codBarras: "87654321",
          stock: 3,
        }),
      ),
    (error) => error.statusCode === 409 && error.message.includes("codigo de barras"),
  );
  assert.equal(checkedProductId, 30);
});

test("DeleteProductUseCase no elimina cuando el producto no existe", async () => {
  let deleteWasCalled = false;
  const useCase = new DeleteProductUseCase(
    createRepo({
      findById: async () => null,
      delete: async () => {
        deleteWasCalled = true;
      },
    }),
  );

  await assert.rejects(
    () => useCase.execute(404),
    (error) => error.statusCode === 404 && error.message.includes("Producto no encontrado"),
  );
  assert.equal(deleteWasCalled, false);
});

test("mapProduct calcula stock total desde todos los codigos de barras", () => {
  const result = mapProduct({
    ...productFromDatabase,
    barcodes: [
      {
        id_barcode: 1,
        barcode: "12345678",
        barcode_type: "EAN13",
        stock: 5,
      },
      {
        id_barcode: 2,
        barcode: "87654321",
        barcode_type: "EAN13",
        stock: 7,
      },
    ],
  });

  assert.equal(result.totalStock, 12);
  assert.deepEqual(
    result.barcodes.map((barcode) => barcode.stock),
    [5, 7],
  );
});


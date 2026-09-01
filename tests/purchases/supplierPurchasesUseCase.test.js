import test from "node:test";
import assert from "node:assert/strict";

import { CreateSupplierPurchaseDto } from "../../src/modules/purchases/supplierPurchases/dtos/createSupplierPurchase.dto.js";
import { createSupplierPurchaseValidator } from "../../src/modules/purchases/supplierPurchases/validators/supplierPurchasesValidator.js";
import { CreateSupplierPurchaseUseCase } from "../../src/modules/purchases/supplierPurchases/use-cases/createSupplierPurchaseUsecase.js";
import { SupplierPurchaseMapper } from "../../src/modules/purchases/supplierPurchases/mappers/supplierPurchaseMapper.js";
import { SupplierPurchaseRepository } from "../../src/modules/purchases/supplierPurchases/repositories/supplierPurchaseRepository.js";
import { prisma } from "../../src/config/prisma.js";

const originalRepositoryMethods = {
  findByInvoiceNumber: SupplierPurchaseRepository.prototype.findByInvoiceNumber,
  findProviderById: SupplierPurchaseRepository.prototype.findProviderById,
  findProductById: SupplierPurchaseRepository.prototype.findProductById,
  findBarcodeByCode: SupplierPurchaseRepository.prototype.findBarcodeByCode,
  create: SupplierPurchaseRepository.prototype.create,
};

const originalPrismaMethods = {
  usersFindMany: prisma.users.findMany,
};

const restoreRepositoryMethods = () => {
  Object.assign(SupplierPurchaseRepository.prototype, originalRepositoryMethods);
  prisma.users.findMany = originalPrismaMethods.usersFindMany;
};

const validPurchaseInput = {
  invoiceNumber: "FAC-001",
  purchaseDate: "2026-01-15",
  idProvider: 5,
  details: [
    {
      idProduct: 10,
      quantity: 2,
      supplierPrice: 10000,
      purchaseType: "Unidad",
      quantityPerPack: 0,
      extraBarcodes: [" EXTRA-001 ", "", "EXTRA-002"],
    },
  ],
};

const productWithBarcode = {
  id_product: 10,
  name: "Producto compra",
  wholesale_price: 12000,
  iva_percentage: 19,
  barcodes: [
    {
      id_barcode: 22,
      barcode: "MAIN-001",
    },
  ],
};

test("CreateSupplierPurchaseDto normaliza numeros, fecha y codigos extra", () => {
  const dto = new CreateSupplierPurchaseDto(validPurchaseInput);

  assert.equal(dto.invoiceNumber, "FAC-001");
  assert.equal(dto.idProvider, 5);
  assert.equal(dto.purchaseDate instanceof Date, true);
  assert.deepEqual(dto.details[0].extraBarcodes, ["EXTRA-001", "EXTRA-002"]);
  assert.equal(dto.details[0].quantity, 2);
  assert.equal(dto.details[0].supplierPrice, 10000);
});

test("createSupplierPurchaseValidator rechaza factura con caracteres invalidos y fecha futura", () => {
  const result = createSupplierPurchaseValidator.safeParse({
    body: {
      ...validPurchaseInput,
      invoiceNumber: "FAC 001!",
      purchaseDate: "2999-01-01",
    },
  });

  assert.equal(result.success, false);
  assert.equal(
    result.error.issues.some((issue) => issue.path.join(".") === "body.invoiceNumber"),
    true,
  );
  assert.equal(
    result.error.issues.some((issue) => issue.path.join(".") === "body.purchaseDate"),
    true,
  );
});

test("CreateSupplierPurchaseUseCase rechaza factura duplicada antes de validar proveedor", async () => {
  let providerWasChecked = false;

  SupplierPurchaseRepository.prototype.findByInvoiceNumber = async () => ({
    id_purchase: 99,
  });
  SupplierPurchaseRepository.prototype.findProviderById = async () => {
    providerWasChecked = true;
  };

  try {
    const useCase = new CreateSupplierPurchaseUseCase();

    await assert.rejects(
      () => useCase.execute(new CreateSupplierPurchaseDto(validPurchaseInput)),
      (error) => error.statusCode === 409 && error.message.includes("factura"),
    );
    assert.equal(providerWasChecked, false);
  } finally {
    restoreRepositoryMethods();
  }
});

test("CreateSupplierPurchaseUseCase rechaza proveedor inexistente", async () => {
  SupplierPurchaseRepository.prototype.findByInvoiceNumber = async () => null;
  SupplierPurchaseRepository.prototype.findProviderById = async () => null;

  try {
    const useCase = new CreateSupplierPurchaseUseCase();

    await assert.rejects(
      () => useCase.execute(new CreateSupplierPurchaseDto(validPurchaseInput)),
      (error) => error.statusCode === 404 && error.message.includes("Proveedor"),
    );
  } finally {
    restoreRepositoryMethods();
  }
});

test("CreateSupplierPurchaseUseCase rechaza producto sin codigo de barras", async () => {
  SupplierPurchaseRepository.prototype.findByInvoiceNumber = async () => null;
  SupplierPurchaseRepository.prototype.findProviderById = async () => ({
    id_provider: 5,
    name_provider: "Proveedor Demo",
    max_return_period: 15,
  });
  SupplierPurchaseRepository.prototype.findProductById = async () => ({
    ...productWithBarcode,
    barcodes: [],
  });

  try {
    const useCase = new CreateSupplierPurchaseUseCase();

    await assert.rejects(
      () => useCase.execute(new CreateSupplierPurchaseDto(validPurchaseInput)),
      (error) => error.statusCode === 422 && /c[oó]digo de barras/.test(error.message),
    );
  } finally {
    restoreRepositoryMethods();
  }
});

test("CreateSupplierPurchaseUseCase calcula fecha maxima, stock por paca y subtotales", async () => {
  let receivedPurchaseData = null;
  let receivedDetails = null;
  const originalConsoleError = console.error;

  SupplierPurchaseRepository.prototype.findByInvoiceNumber = async () => null;
  SupplierPurchaseRepository.prototype.findProviderById = async () => ({
    id_provider: 5,
    name_provider: "Proveedor Demo",
    max_return_period: 15,
  });
  SupplierPurchaseRepository.prototype.findProductById = async () => productWithBarcode;
  SupplierPurchaseRepository.prototype.findBarcodeByCode = async () => null;
  prisma.users.findMany = async () => [];
  SupplierPurchaseRepository.prototype.create = async (purchaseData, details) => {
    receivedPurchaseData = purchaseData;
    receivedDetails = details;

    return {
      id_purchase: 40,
      invoice_number: purchaseData.invoice_number,
      purchase_date: purchaseData.purchase_date,
      total_amount: purchaseData.total_amount,
      id_provider: purchaseData.id_provider,
      id_purchase_status: purchaseData.id_purchase_status,
      max_return_date: purchaseData.max_return_date,
      providers: {
        name_provider: "Proveedor Demo",
        max_return_period: 15,
      },
      purchase_statuses: {
        name_puchase_status: "Completada",
      },
      purchase_details: [],
    };
  };

  try {
    console.error = () => {};
    const useCase = new CreateSupplierPurchaseUseCase();
    const dto = new CreateSupplierPurchaseDto({
      ...validPurchaseInput,
      purchaseDate: new Date(2026, 0, 15),
      details: [
        {
          idProduct: 10,
          quantity: 3,
          supplierPrice: 10000,
          purchaseType: "X Paca",
          quantityPerPack: 12,
          extraBarcodes: [],
        },
      ],
    });

    const result = await useCase.execute(dto);

    assert.equal(receivedDetails[0].primaryBarcodeId, 22);
    assert.equal(receivedDetails[0].stockAdded, 36);
    assert.equal(receivedDetails[0].grossSubtotal, 30000);
    assert.equal(receivedDetails[0].ivaSubtotal, 5700);
    assert.equal(receivedDetails[0].netSubtotal, 35700);
    assert.equal(receivedPurchaseData.total_amount, 35700);
    assert.equal(receivedPurchaseData.max_return_date.getDate(), 30);
    assert.equal(result.id, 40);
    assert.equal(result.providerName, "Proveedor Demo");
  } finally {
    console.error = originalConsoleError;
    restoreRepositoryMethods();
  }
});

test("SupplierPurchaseMapper limita cantidad retornable al stock disponible", () => {
  const detail = SupplierPurchaseMapper.detailToDTO({
    id_purchase_detail: 1,
    id_barcode: 22,
    quantity: 10,
    stock_added: 10,
    gross_unit_price: 10000,
    tax_unit_price: 1900,
    net_unit_price: 11900,
    gross_subtotal: 100000,
    iva_subtotal: 19000,
    net_subtotal: 119000,
    tax_percentage: 19,
    batch_code: "LOTE-10-2026-01-15",
    returnAvailability: {
      purchasedQuantity: 10,
      reservedQuantity: 2,
      finalReturnedQuantity: 1,
      availableQuantity: 7,
    },
    barcodes: {
      id_barcode: 22,
      barcode: "MAIN-001",
      stock: 4,
      id_product: 10,
      products: {
        name: "Producto compra",
        barcodes: [
          { id_barcode: 22, barcode: "MAIN-001" },
          { id_barcode: 23, barcode: "EXTRA-001" },
        ],
      },
    },
  });

  assert.equal(detail.returnAvailableQuantity, 7);
  assert.equal(detail.stockAvailable, 4);
  assert.equal(detail.returnEligibleQuantity, 4);
  assert.deepEqual(detail.extraBarcodes, ["EXTRA-001"]);
});

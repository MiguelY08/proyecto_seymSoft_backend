import { AppError } from "../../../../shared/errors/appError.js";
import {
  processAndSaveImage,
  PRODUCT_IMAGE_CONFIG,
} from "../../../../shared/utils/imageProcessor.js";

export const getProductImageFiles = (files = []) =>
  files.filter((file) => file.fieldname === "images");

export const getVariantImageFiles = (files = []) =>
  files
    .filter((file) => /^variantImage_\d+$/.test(file.fieldname))
    .map((file) => ({
      index: Number(file.fieldname.replace("variantImage_", "")),
      file,
    }));

export const saveVariantImages = async ({ repo, product, barcodes, files }) => {
  const variantFiles = getVariantImageFiles(files);

  for (const { index, file } of variantFiles) {
    const barcodeData = barcodes?.[index];
    const persistedBarcode = product.barcodes?.find(
      (barcode) => String(barcode.barcode) === String(barcodeData?.barcode),
    );

    if (!barcodeData || !persistedBarcode) {
      throw new AppError(`No se pudo asociar la imagen al codigo de barras ${index + 1}.`, 400);
    }

    const variantImageUrl = await processAndSaveImage(file.buffer, {
      bucketName: process.env.SUPABASE_BUCKET_PRODUCTS || "products",
      config: {
        ...PRODUCT_IMAGE_CONFIG,
        prefix: `product_${product.id_product}_variant_${index}`,
      },
    });

    await repo.updateBarcodeVariant(persistedBarcode.id_barcode, {
      variantName: barcodeData.variant_name,
      variantImageUrl,
    });
  }
};
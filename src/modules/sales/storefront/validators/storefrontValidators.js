import { z } from "zod";

const positiveId = z.coerce.number().int().positive();

export const productIdParamsSchema = z.object({
  productId: positiveId,
});

export const cartVariantParamsSchema = z.object({
  productId: positiveId,
  barcodeId: positiveId,
});

export const cartItemSchema = z.object({
  barcodeId: positiveId,
  quantity: z.coerce.number().int().positive().max(100000),
});

export const cartQuantitySchema = z.object({
  quantity: z.coerce.number().int().positive().max(100000),
});

export const mergeCartSchema = z.object({
  items: z.array(
    z.object({
      productId: positiveId,
      barcodeId: positiveId,
      quantity: z.coerce.number().int().positive().max(100000),
    }),
  ).max(200),
});

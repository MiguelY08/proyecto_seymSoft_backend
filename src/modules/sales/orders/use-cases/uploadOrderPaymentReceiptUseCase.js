import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { DELIVERY_TYPES } from '../../shared/deliveryTypes.js';
import {
  deleteImage,
  PAYMENT_RECEIPT_IMAGE_CONFIG,
  processAndSaveImage,
} from '../../../../shared/utils/imageProcessor.js';
import { analyzePaymentReceipt } from '../services/paymentReceiptOcrService.js';

const getReceiptBucket = () =>
  process.env.SUPABASE_BUCKET_PAYMENT_RECEIPTS ||
  process.env.SUPABASE_BUCKET_PRODUCTS;

const deleteOrphanReceiptImage = async ({ imageUrl, bucketName, idOrder }) => {
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await deleteImage(imageUrl, { bucketName });
      return true;
    } catch (error) {
      lastError = error;
      console.error(
        `[UploadOrderPaymentReceiptUseCase] Fallo limpiando imagen huérfana (intento ${attempt}/${maxAttempts}):`,
        error.message
      );
    }
  }

  // Storage no participa en la transacción de BD. Este evento permitirá que
  // el futuro worker/outbox elimine el archivo de manera idempotente.
  console.error('[ORPHAN_PAYMENT_RECEIPT_IMAGE]', {
    idOrder: Number(idOrder),
    bucketName,
    imageUrl,
    attempts: maxAttempts,
    error: lastError?.message || 'Error desconocido',
  });

  return false;
};

const mapReceipt = (receipt) => ({
  id: receipt.id_order_payment_receipt,
  orderId: receipt.id_order,
  imageUrl: receipt.image_url,
  fileName: receipt.file_name,
  observations: receipt.observations,
  status: receipt.verification_status,
  uploadedAt: receipt.uploaded_at,
  analysis: {
    status: receipt.ai_analysis_status,
    analyzedAt: receipt.ai_analyzed_at,
    model: receipt.ai_model,
    confidence: receipt.ai_confidence === null
      ? null
      : Number(receipt.ai_confidence),
    amount: receipt.ai_amount === null ? null : Number(receipt.ai_amount),
    currency: receipt.ai_currency,
    transactionReference: receipt.ai_transaction_reference,
    transactionDate: receipt.ai_transaction_date,
    transactionTime: receipt.ai_transaction_time,
    bank: receipt.ai_bank,
    senderName: receipt.ai_sender_name,
    recipientName: receipt.ai_recipient_name,
    statusText: receipt.ai_status,
    warnings: receipt.ai_warnings || [],
    error: receipt.ai_error ? 'No fue posible completar el análisis automático.' : null,
  },
});

export class UploadOrderPaymentReceiptUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(idOrder, file, options = {}) {
    if (!file?.buffer) {
      throw new AppError('La imagen del comprobante es obligatoria.', 400);
    }

    const order = await this.repo.findReceiptUploadContextById(idOrder);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    if (Number(order.clients?.id_user) !== Number(options.idUser)) {
      throw new AppError(
        'No tienes permiso para adjuntar comprobantes a este pedido.',
        403
      );
    }

    if (Number(order.id_order_status) === ORDER_STATUSES[4].id) {
      throw new AppError(
        'No se pueden adjuntar comprobantes a un pedido cancelado.',
        400
      );
    }

    if (Number(order.id_payment_status) === PAYMENT_STATUSES[2].id) {
      throw new AppError(
        'El pedido ya se encuentra pagado y no requiere comprobantes.',
        400
      );
    }

    if (order.order_payment_receipts?.length) {
      throw new AppError(
        'Ya existe un comprobante pendiente de revision para este pedido.',
        409
      );
    }

    if (
      order.delivery_type === DELIVERY_TYPES.DELIVERY &&
      Number(order.shipping_amount || 0) <= 0
    ) {
      throw new AppError(
        'Debes esperar a que el administrador asigne el valor del envio antes de adjuntar el comprobante.',
        400
      );
    }

    const bucketName = getReceiptBucket();

    if (!bucketName) {
      throw new AppError(
        'No se configuro el bucket para comprobantes de pago.',
        500
      );
    }

    let imageUrl = null;

    try {
      imageUrl = await processAndSaveImage(file.buffer, {
        bucketName,
        config: {
          ...PAYMENT_RECEIPT_IMAGE_CONFIG,
          prefix: `order_${Number(idOrder)}_receipt`,
        },
      });

      let analysis;
      try {
        analysis = await analyzePaymentReceipt(file.buffer);
      } catch (error) {
        console.error('[PaymentReceiptOCR] No fue posible analizar el comprobante:', error.message);
        analysis = {
          status: 'Fallido',
          analyzedAt: new Date(),
          model: 'tesseract.js-spa',
          confidence: null,
          amount: null,
          currency: null,
          transactionReference: null,
          transactionDate: null,
          transactionTime: null,
          bank: null,
          senderName: null,
          recipientName: null,
          statusText: null,
          warnings: ['El análisis automático falló; se requiere revisión manual.'],
          error: error.message,
          rawText: null,
        };
      }

      const receipt = await this.repo.createPaymentReceipt(idOrder, {
        imageUrl,
        fileName: file.originalname,
        observations: options.observations,
        analysis,
      });

      return mapReceipt(receipt);
    } catch (error) {
      if (imageUrl) {
        await deleteOrphanReceiptImage({
          imageUrl,
          bucketName,
          idOrder,
        });
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        error.message || 'No fue posible guardar el comprobante.',
        500
      );
    }
  }
}

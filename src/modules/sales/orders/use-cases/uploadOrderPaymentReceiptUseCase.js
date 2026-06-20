import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import {
  deleteImage,
  PAYMENT_RECEIPT_IMAGE_CONFIG,
  processAndSaveImage,
} from '../../../../shared/utils/imageProcessor.js';

const getReceiptBucket = () =>
  process.env.SUPABASE_BUCKET_PAYMENT_RECEIPTS ||
  process.env.SUPABASE_BUCKET_PRODUCTS;

const mapReceipt = (receipt) => ({
  id: receipt.id_order_payment_receipt,
  orderId: receipt.id_order,
  imageUrl: receipt.image_url,
  fileName: receipt.file_name,
  observations: receipt.observations,
  status: receipt.verification_status,
  uploadedAt: receipt.uploaded_at,
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

      const receipt = await this.repo.createPaymentReceipt(idOrder, {
        imageUrl,
        fileName: file.originalname,
        observations: options.observations,
      });

      return mapReceipt(receipt);
    } catch (error) {
      if (imageUrl) {
        try {
          await deleteImage(imageUrl, { bucketName });
        } catch (cleanupError) {
          console.error(
            '[UploadOrderPaymentReceiptUseCase] No se pudo eliminar la imagen huerfana:',
            cleanupError.message
          );
        }
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

import multer from 'multer';
import { AppError } from '../../../../shared/errors/appError.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(
        new AppError(
          'El comprobante debe ser una imagen PNG, JPG o JPEG.',
          400
        )
      );
      return;
    }

    callback(null, true);
  },
}).single('image');

export const uploadOrderPaymentReceipt = (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('El comprobante no puede superar los 10 MB.', 400));
        return;
      }

      next(new AppError('No fue posible procesar el comprobante.', 400));
      return;
    }

    next(error);
  });
};

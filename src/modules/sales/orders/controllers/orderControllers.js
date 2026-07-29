import { httpCodes } from '../../../../shared/constants/httpCodes.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { CreateOrderDto } from '../dtos/createOrder.dto.js';
import { UpdateOrderDto } from '../dtos/updateOrder.dto.js';
import {
  CreateOrderUseCase,
  notifyAdminsNewWebOrder,
  notifyOrderCreated,
} from '../use-cases/createOrderUseCase.js';
import {
  UpdateOrderUseCase,
  notifyOrderShippingAssigned,
  notifyOrderUpdated,
  notifyOrderStatusChanged,
} from '../use-cases/updateOrderUseCase.js';
import { UpdateOrderShippingUseCase } from '../use-cases/updateOrderShippingUseCase.js';
import { GetAllOrdersUseCase } from '../use-cases/getAllOrdersUseCase.js';
import { GetOrderByIdUseCase } from '../use-cases/getOrderByIdUseCase.js';
import {
  CancelOrderUseCase,
  notifyOrderCancelled,
} from '../use-cases/cancelOrderUseCase.js';
import {
  RegisterOrderPaymentUseCase,
  notifyPaymentRegistered,
} from '../use-cases/registerOrderPaymentUseCase.js';
import { UploadOrderPaymentReceiptUseCase } from '../use-cases/uploadOrderPaymentReceiptUseCase.js';
import {
  ReviewOrderPaymentReceiptUseCase,
  notifyPaymentReceiptReviewed,
} from '../use-cases/reviewOrderPaymentReceiptUseCase.js';
import {
  validateOrderIdParams,
  validateOrderPaymentReceiptParams,
  validateRegisterOrderPayment,
  validateReviewOrderPaymentReceipt,
} from '../validators/orderValidator.js';

const repo = new OrderRepository();

const buildDto = (DtoClass, data) => {
  try {
    return new DtoClass(data);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(error.message || 'Errores de validacion.', 400);
  }
};

// Crear pedido con los datos recibidos desde el cliente.
export const createOrder = async (req, res, next) => {
  try {
    // Normalizar y validar datos de entrada con DTO.
    const dto = buildDto(CreateOrderDto, req.body);

    const data = await new CreateOrderUseCase(repo).execute(dto);
    const message = data.hasSale
      ? 'Pedido registrado exitosamente. Venta directa generada.'
      : 'Pedido registrado exitosamente.';

    res.once('finish', () => {
      setImmediate(() => {
        void notifyOrderCreated(data);
        void notifyAdminsNewWebOrder(data);
      });
    });

    res.status(httpCodes.CREATED).json({
      success: true,
      message,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Obtener todos los pedidos registrados con paginacion y filtros.
export const getAllOrders = async (req, res, next) => {
  try {
    const result = await new GetAllOrdersUseCase(repo).execute(req.query);

    res.status(httpCodes.OK).json({
      success: true,
      message: 'Pedidos obtenidos exitosamente.',
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Obtener un pedido especifico por ID.
export const getOrderById = async (req, res, next) => {
  try {
    const data = await new GetOrderByIdUseCase(repo).execute(req.params.id);

    res.status(httpCodes.OK).json({
      success: true,
      message: 'Pedido obtenido exitosamente.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Actualizar los datos permitidos de un pedido.
export const updateOrder = async (req, res, next) => {
  try {
    // Normalizar y validar datos modificables del pedido.
    const dto = buildDto(UpdateOrderDto, req.body);
    const result = await new UpdateOrderUseCase(repo).execute(req.params.id, dto);
    const data = result.order;

    if (result.statusNotification) {
      res.once('finish', () => {
        setImmediate(() => {
          void notifyOrderStatusChanged(result.statusNotification);
        });
      });
    }

    if (result.updateNotification) {
      res.once('finish', () => {
        setImmediate(() => {
          void notifyOrderUpdated(result.updateNotification);
        });
      });
    }

    if (result.shippingNotification) {
      res.once('finish', () => {
        setImmediate(() => {
          void notifyOrderShippingAssigned(result.shippingNotification);
        });
      });
    }

    res.status(httpCodes.OK).json({
      success: true,
      message: 'Pedido actualizado exitosamente.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Registrar o actualizar solo el valor del envio de un pedido.
export const updateOrderShipping = async (req, res, next) => {
  try {
    const paramsValidation = validateOrderIdParams(req.params);

    if (!paramsValidation.success) {
      return res.status(httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Errores de validacion en parametros.',
        errors: paramsValidation.errors,
      });
    }

    const result = await new UpdateOrderShippingUseCase(repo).execute(
      paramsValidation.data.id,
      req.body
    );
    const data = result.order;

    if (result.shippingNotification) {
      res.once('finish', () => {
        setImmediate(() => {
          void notifyOrderShippingAssigned(result.shippingNotification);
        });
      });
    }

    res.status(httpCodes.OK).json({
      success: true,
      message: 'Valor de envio actualizado exitosamente.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Cancelar un pedido existente.
export const cancelOrder = async (req, res, next) => {
  try {
    const cancellationReason =
      req.body?.cancellationReason ||
      req.body?.cancelReason ||
      req.body?.reason;

    const data = await new CancelOrderUseCase(repo).execute(
      req.params.id,
      cancellationReason
    );

    res.once('finish', () => {
      setImmediate(() => {
        void notifyOrderCancelled({
          order:
            data,
          reason:
            data.cancellationReason || cancellationReason,
        });
      });
    });

    res.status(httpCodes.OK).json({
      success: true,
      message: 'Pedido cancelado exitosamente.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Registrar pago o abono de un pedido.
export const registerOrderPayment = async (req, res, next) => {
  try {
    const paramsValidation = validateOrderIdParams(req.params);

    if (!paramsValidation.success) {
      return res.status(httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Errores de validacion en parametros.',
        errors: paramsValidation.errors,
      });
    }

    const bodyValidation = validateRegisterOrderPayment(req.body);

    if (!bodyValidation.success) {
      return res.status(httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Errores de validacion.',
        errors: bodyValidation.errors,
      });
    }

    const result = await new RegisterOrderPaymentUseCase(repo).execute(
      paramsValidation.data.id,
      bodyValidation.data,
      {
        idUser: req.user?.id_user || req.user?.idUser || null,
      }
    );
    const {
      paymentNotification,
      ...data
    } = result;

    if (paymentNotification) {
      res.once('finish', () => {
        setImmediate(() => {
          void notifyPaymentRegistered(paymentNotification);
        });
      });
    }

    const message = data.paymentSummary?.isPaid
      ? 'Pago registrado exitosamente. El pedido quedo pagado y la venta fue generada.'
      : 'Abono registrado exitosamente. El pedido continua pendiente de pago.';

    res.status(httpCodes.CREATED).json({
      success: true,
      message: data.recoveredSale
        ? 'Venta pendiente generada exitosamente para un pedido ya pagado.'
        : message,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Almacenar una imagen como comprobante pendiente, sin afectar el valor pagado.
export const uploadOrderPaymentReceipt = async (req, res, next) => {
  try {
    const paramsValidation = validateOrderIdParams(req.params);

    if (!paramsValidation.success) {
      return res.status(httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Errores de validacion en parametros.',
        errors: paramsValidation.errors,
      });
    }

    const observations = String(req.body?.observations || '').trim();

    if (observations.length > 255) {
      return res.status(httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Las observaciones no pueden exceder 255 caracteres.',
      });
    }

    const data = await new UploadOrderPaymentReceiptUseCase(repo).execute(
      paramsValidation.data.id,
      req.file,
      {
        idUser: req.user?.id_user || req.user?.idUser,
        observations: observations || null,
      }
    );

    return res.status(httpCodes.CREATED).json({
      success: true,
      message: 'Comprobante almacenado y pendiente de verificacion.',
      data: {
        paymentReceipt: data,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Revisar un comprobante pendiente: aprobarlo o rechazarlo con motivo.
export const reviewOrderPaymentReceipt = async (req, res, next) => {
  try {
    const paramsValidation = validateOrderPaymentReceiptParams(req.params);

    if (!paramsValidation.success) {
      return res.status(httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Errores de validacion en parametros.',
        errors: paramsValidation.errors,
      });
    }

    const bodyValidation = validateReviewOrderPaymentReceipt(req.body);

    if (!bodyValidation.success) {
      return res.status(httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Errores de validacion.',
        errors: bodyValidation.errors,
      });
    }

    const data = await new ReviewOrderPaymentReceiptUseCase(repo).execute(
      paramsValidation.data.id,
      paramsValidation.data.receiptId,
      bodyValidation.data,
      {
        idUser: req.user?.id_user || req.user?.idUser || null,
      }
    );

    const {
      receiptNotification,
      ...responseData
    } = data;

    if (receiptNotification) {
      res.once('finish', () => {
        setImmediate(() => {
          void notifyPaymentReceiptReviewed(receiptNotification);
        });
      });
    }

    return res.status(httpCodes.OK).json({
      success: true,
      message: responseData.paymentResult
        ? 'Comprobante aprobado y pago pendiente registrado exitosamente.'
        : 'Comprobante revisado exitosamente.',
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
};


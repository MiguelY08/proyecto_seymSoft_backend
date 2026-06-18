import { httpCodes } from '../../../../shared/constants/httpCodes.js';
import { ORDER_STATUSES } from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { CreateOrderDto } from '../dtos/createOrder.dto.js';
import { UpdateOrderDto } from '../dtos/updateOrder.dto.js';
import { CreateOrderUseCase } from '../use-cases/createOrderUseCase.js';
import { UpdateOrderUseCase } from '../use-cases/updateOrderUseCase.js';
import { GetAllOrdersUseCase } from '../use-cases/getAllOrdersUseCase.js';
import { GetOrderByIdUseCase } from '../use-cases/getOrderByIdUseCase.js';
import { CancelOrderUseCase } from '../use-cases/cancelOrderUseCase.js';
import { RegisterOrderPaymentUseCase } from '../use-cases/registerOrderPaymentUseCase.js';
import {
  validateOrderIdParams,
  validateRegisterOrderPayment,
} from '../validators/orderValidator.js';

const repo = new OrderRepository();

// Crear pedido con los datos recibidos desde el cliente.
export const createOrder = async (req, res, next) => {
  try {
    // Normalizar y validar datos de entrada con DTO.
    const dto = new CreateOrderDto(req.body);

    if (Number(dto.idOrderStatus) === ORDER_STATUSES[3].id) {
      throw new AppError(
        'Los pedidos entregados deben registrarse desde el flujo de venta directa.',
        httpCodes.BAD_REQUEST
      );
    }

    const data = await new CreateOrderUseCase(repo).execute(dto);

    res.status(httpCodes.CREATED).json({
      success: true,
      message: 'Pedido registrado exitosamente.',
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
    const dto = new UpdateOrderDto(req.body);
    const data = await new UpdateOrderUseCase(repo).execute(req.params.id, dto);

    res.status(httpCodes.OK).json({
      success: true,
      message: 'Pedido actualizado exitosamente.',
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

    const data = await new RegisterOrderPaymentUseCase(repo).execute(
      paramsValidation.data.id,
      bodyValidation.data,
      {
        idUser: req.user?.id_user || req.user?.idUser || null,
      }
    );

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


import { httpCodes } from '../../../../shared/constants/httpCodes.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { CreateOrderDto } from '../dtos/createOrder.dto.js';
import { UpdateOrderDto } from '../dtos/updateOrder.dto.js';
import { CreateOrderUseCase } from '../use-cases/createOrderUseCase.js';
import { UpdateOrderUseCase } from '../use-cases/updateOrderUseCase.js';
import { GetAllOrdersUseCase } from '../use-cases/getAllOrdersUseCase.js';
import { GetOrderByIdUseCase } from '../use-cases/getOrderByIdUseCase.js';
import { CancelOrderUseCase } from '../use-cases/cancelOrderUseCase.js';

const repo = new OrderRepository();

export const createOrder = async (req, res, next) => {
  try {
    const dto = new CreateOrderDto(req.body);
    const data = await new CreateOrderUseCase(repo).execute(dto);

    res.status(httpCodes.CREATED).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const data = await new GetAllOrdersUseCase(repo).execute(req.query);

    res.status(httpCodes.OK).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const data = await new GetOrderByIdUseCase(repo).execute(req.params.id);

    res.status(httpCodes.OK).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const dto = new UpdateOrderDto(req.body);
    const data = await new UpdateOrderUseCase(repo).execute(req.params.id, dto);

    res.status(httpCodes.OK).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const data = await new CancelOrderUseCase(repo).execute(req.params.id);

    res.status(httpCodes.OK).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
import { CreateSupplierPurchaseUseCase }  from '../use-cases/createSupplierPurchaseUsecase.js';
import { CreateSupplierPurchaseDto }      from '../dtos/createSupplierPurchase.dto.js';
import { createSupplierPurchaseValidator } from '../validators/supplierPurchasesValidator.js';
import { ZodError } from 'zod';

const createSupplierPurchaseUseCase = new CreateSupplierPurchaseUseCase();

export const createSupplierPurchaseController = async (req, res, next) => {
  try {
    const result = createSupplierPurchaseValidator.safeParse({ body: req.body });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const dto  = new CreateSupplierPurchaseDto(result.data.body);
    const data = await createSupplierPurchaseUseCase.execute(dto);
    res.status(201).json({ success: true, message: 'Compra registrada exitosamente.', data });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    next(err);
  }
};
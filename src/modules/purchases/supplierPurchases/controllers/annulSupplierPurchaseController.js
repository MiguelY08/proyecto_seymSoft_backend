import { AnnulSupplierPurchaseUseCase }  from '../use-cases/annulSupplierPurchaseUsecase.js';
import { AnnulSupplierPurchaseDto }      from '../dtos/annulSupplierPurchase.dto.js';
import { annulSupplierPurchaseValidator } from '../validators/supplierPurchasesValidator.js';
import { ZodError } from 'zod';

const annulSupplierPurchaseUseCase = new AnnulSupplierPurchaseUseCase();

export const annulSupplierPurchaseController = async (req, res, next) => {
  try {
    const result = annulSupplierPurchaseValidator.safeParse({ params: req.params, body: req.body });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const { id } = result.data.params;
    const dto    = new AnnulSupplierPurchaseDto(result.data.body);
    const data   = await annulSupplierPurchaseUseCase.execute(id, dto);
    res.status(200).json({ success: true, message: 'Compra anulada exitosamente.', data });
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
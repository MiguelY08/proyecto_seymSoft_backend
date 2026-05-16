import { GetSupplierPurchaseByIdUseCase }  from '../use-cases/getSupplierPurchaseByIdUsecase.js';
import { getSupplierPurchaseByIdValidator } from '../validators/supplierPurchasesValidator.js';

const getSupplierPurchaseByIdUseCase = new GetSupplierPurchaseByIdUseCase();

export const getSupplierPurchaseByIdController = async (req, res, next) => {
  try {
    const result = getSupplierPurchaseByIdValidator.safeParse({ params: req.params });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const { id } = result.data.params;
    const data   = await getSupplierPurchaseByIdUseCase.execute(id);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

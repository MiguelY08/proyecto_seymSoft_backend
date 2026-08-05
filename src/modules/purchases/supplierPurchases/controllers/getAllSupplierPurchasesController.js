// backend/src/modules/supplier-purchases/controllers/getAllSupplierPurchasesController.js
import { GetAllSupplierPurchasesUseCase }  from '../use-cases/getAllSupplierPurchasesUsecase.js';
import { getSupplierPurchasesValidator }   from '../validators/supplierPurchasesValidator.js';
import { ZodError } from 'zod';

const getAllSupplierPurchasesUseCase = new GetAllSupplierPurchasesUseCase();

export const getAllSupplierPurchasesController = async (req, res, next) => {
  try {
    const result = getSupplierPurchasesValidator.safeParse({ query: req.query });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const { 
      page, 
      limit, 
      search, 
      startDate, 
      endDate,
      sortField = 'id_purchase',
      sortOrder = 'desc'
    } = result.data.query;
    
    const data = await getAllSupplierPurchasesUseCase.execute({ 
      page, 
      limit, 
      search, 
      startDate, 
      endDate,
      sortField,
      sortOrder
    });
    res.status(200).json({ success: true, ...data });
  } catch (err) { next(err); }
};
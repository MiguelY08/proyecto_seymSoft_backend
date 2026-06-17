// backend/src/modules/non-conforming-products/controllers/getProductByBarcodeController.js
import { NonConformingRepository } from '../repositories/nonConformingRepository.js';

const repo = new NonConformingRepository();

export const getProductByBarcodeController = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    
    const barcodeRecord = await repo.findBarcodeByValue(barcode);
    
    if (!barcodeRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'Código de barras no encontrado' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id_barcode: barcodeRecord.id_barcode,
        barcode: barcodeRecord.barcode,
        id_product: barcodeRecord.id_product,
        productName: barcodeRecord.products?.name,
        categoryName: barcodeRecord.products?.categories?.category_name,
        price: barcodeRecord.products?.retail_price,
        stock: barcodeRecord.stock || 0,
      }
    });
  } catch (err) {
    next(err);
  }
};
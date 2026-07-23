// backend/src/modules/purchases/non-conforming-products/use-cases/createNonConformingUsecase.js
import { prisma } from '../../../../config/prisma.js';
import { NonConformingRepository } from '../repositories/nonConformingRepository.js';
import { NonConformingMapper } from '../mappers/nonConformingMapper.js';
import { notifyLowStockProductForCartOwners } from '../../../notifications/services/stockNotificationService.js';

const repo = new NonConformingRepository();

const nonConformingInclude = {
  barcodes: {
    include: {
      products: {
        include: {
          categories: {
            select: {
              category_name: true,
            }
          }
        }
      }
    }
  },
  general_statuses: {
    select: {
      name_status: true,
    }
  }
};

export class CreateNonConformingUseCase {
  async execute(dto) {
    // 1. Verificar que el código de barras exista
    const barcode = await repo.findBarcodeById(dto.id_barcode);
    if (!barcode) {
      const error = new Error(`El código de barras con ID ${dto.id_barcode} no existe.`);
      error.statusCode = 404;
      throw error;
    }

    // 2. Verificar que haya suficiente stock
    const currentStock = barcode.stock || 0;
    if (currentStock < dto.affected_quantity) {
      const error = new Error(`Stock insuficiente. Stock actual: ${currentStock}, Cantidad a reportar: ${dto.affected_quantity}`);
      error.statusCode = 409;
      throw error;
    }

    // ✅ ELIMINAR esta validación para permitir múltiples reportes
    // const existing = await repo.findByBarcode(dto.id_barcode);
    // if (existing && existing.id_status === 1) {
    //   const error = new Error('Ya existe un reporte activo para este producto.');
    //   error.statusCode = 409;
    //   throw error;
    // }

    // 3. Crear el reporte y restar stock (usando transacción)
    const createData = NonConformingMapper.toCreateDB(dto);
    
    const report = await prisma.$transaction(async (tx) => {
      // Crear el reporte
      const newReport = await tx.non_conforming_products.create({
        data: createData,
        include: nonConformingInclude,
      });
      
      // Restar el stock
      const updatedBarcode = await tx.barcodes.update({
        where: { id_barcode: dto.id_barcode },
        data: {
          stock: {
            decrement: dto.affected_quantity
          }
        },
        select: {
          id_product: true,
        },
      });
      
      return {
        report: newReport,
        idProduct: updatedBarcode.id_product,
      };
    });

    await notifyLowStockProductForCartOwners(report.idProduct);
    
    return NonConformingMapper.toDTO(report.report);
  }
}

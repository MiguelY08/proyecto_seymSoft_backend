// backend/src/modules/non-conforming-products/use-cases/cancelNonConformingUsecase.js
import { prisma } from '../../../../config/prisma.js';
import { NonConformingRepository } from '../repositories/nonConformingRepository.js';
import { NonConformingMapper } from '../mappers/nonConformingMapper.js';

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

export class CancelNonConformingUseCase {
  async execute(id, dto) {
    const existing = await repo.findById(id);
    if (!existing) {
      const error = new Error('Reporte no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    if (existing.id_status === 2) {
      const error = new Error('Este reporte ya está anulado.');
      error.statusCode = 409;
      throw error;
    }

    // Usar transacción para anular y restaurar stock
    const report = await prisma.$transaction(async (tx) => {
      // Anular el reporte
      const updatedReport = await tx.non_conforming_products.update({
        where: { id_ncp: parseInt(id) },
        data: { id_status: 2 },
        include: nonConformingInclude,
      });
      
      // Restaurar el stock
      await tx.barcodes.update({
        where: { id_barcode: existing.id_barcode },
        data: {
          stock: {
            increment: existing.affected_quantity
          }
        }
      });
      
      return updatedReport;
    });
    
    return NonConformingMapper.toDTO(report);
  }
}
// backend/src/modules/non-conforming-products/repositories/nonConformingRepository.js
import { prisma } from '../../../../config/prisma.js';

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

export class NonConformingRepository {

  async findAll({ page, limit, search, startDate, endDate }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { barcodes: { barcode: { contains: search, mode: 'insensitive' } } },
        { barcodes: { products: { name: { contains: search, mode: 'insensitive' } } } },
        { report_reason: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.detection_date = {};
      if (startDate) where.detection_date.gte = new Date(startDate);
      if (endDate) where.detection_date.lte = new Date(endDate);
    }

    const [total, reports] = await Promise.all([
      prisma.non_conforming_products.count({ where }),
      prisma.non_conforming_products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { detection_date: 'desc' },
        include: nonConformingInclude,
      })
    ]);

    return { reports: reports || [], total: total || 0 };
  }

  async findById(id) {
    return prisma.non_conforming_products.findUnique({
      where: { id_ncp: parseInt(id) },
      include: nonConformingInclude,
    });
  }

  async findByBarcode(id_barcode) {
    return prisma.non_conforming_products.findFirst({
      where: { 
        id_barcode: parseInt(id_barcode),
        id_status: 1
      },
      include: nonConformingInclude,
    });
  }

  async findBarcodeByValue(barcode) {
    return prisma.barcodes.findUnique({
      where: { barcode: barcode },
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
    });
  }

  async findBarcodeById(id_barcode) {
    return prisma.barcodes.findUnique({
      where: { id_barcode: parseInt(id_barcode) },
      select: {
        id_barcode: true,
        barcode: true,
        id_product: true,
        stock: true,
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
    });
  }

  async create(data) {
    return prisma.non_conforming_products.create({
      data,
      include: nonConformingInclude,
    });
  }

  async updateStatus(id, updateData) {
    return prisma.non_conforming_products.update({
      where: { id_ncp: parseInt(id) },
      data: updateData,
      include: nonConformingInclude,
    });
  }
}
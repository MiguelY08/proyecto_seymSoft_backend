// backend/src/modules/non-conforming-products/use-cases/getAllNonConformingUsecase.js
import { NonConformingRepository } from '../repositories/nonConformingRepository.js';
import { NonConformingMapper } from '../mappers/nonConformingMapper.js';

const repo = new NonConformingRepository();

export class GetAllNonConformingUseCase {
  async execute({ page, limit, search, startDate, endDate }) {
    const { reports, total } = await repo.findAll({ page, limit, search, startDate, endDate });
    
    return {
      data: (reports || []).map(NonConformingMapper.toDTO),
      pagination: {
        page: page || 1,
        limit: limit || 13,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / (limit || 13)),
      },
    };
  }
}
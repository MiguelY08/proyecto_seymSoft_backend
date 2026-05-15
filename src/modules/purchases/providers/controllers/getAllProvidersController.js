import { GetAllProvidersUseCase } from '../use-cases/getAllProvidersUseCase.js';

const getAllProvidersUseCase = new GetAllProvidersUseCase();

export const getAllProvidersController = async (req, res, next) => {
  try {
    const { page, limit, search, personType, idStatus, sortBy, sortOrder } = req.query;
    
    const result = await getAllProvidersUseCase.execute({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 13,
      search: search || null,
      personType: personType || null,
      idStatus: idStatus ? parseInt(idStatus) : null,
      sortBy: sortBy || 'id_provider',
      sortOrder: sortOrder || 'asc'
    });
    
    res.status(200).json({ 
      success: true, 
      data: result.data, 
      pagination: result.pagination 
    });
  } catch (error) {
    next(error);
  }
};
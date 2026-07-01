import { getAllClientsUseCase } from '../use-cases/getAllClientsUseCase.js';

export const getAllClientsController = async (req, res, next) => {
  try {
    const { page, limit, search, personType, idStatus, sortBy, sortOrder } = req.query;
    const result = await getAllClientsUseCase({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 13,
      search: search || null,
      personType: personType || null,
      idStatus: idStatus ? parseInt(idStatus) : null,
      sortBy: sortBy || 'id_client',
      sortOrder: sortOrder || 'asc'
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

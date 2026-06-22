import { ReturnRepository } from '../repositories/returnRepository.js';

export const getMyReturnsUseCase = async ({ idUser, page = 1, limit = 50 }) => {
  const clientId = await ReturnRepository.findClientIdByUserId(idUser);

  if (!clientId) {
    return {
      success: false,
      error: 'La cuenta autenticada no tiene un cliente asociado.',
      errorCode: 'CLIENT_NOT_FOUND'
    };
  }

  const result = await ReturnRepository.findAll({
    page,
    limit,
    clientId
  });

  return {
    success: true,
    data: result.data,
    pagination: result.pagination
  };
};

export const getMyReturnByIdUseCase = async ({ idUser, idReturn }) => {
  const clientId = await ReturnRepository.findClientIdByUserId(idUser);

  if (!clientId) {
    return {
      success: false,
      error: 'La cuenta autenticada no tiene un cliente asociado.',
      errorCode: 'CLIENT_NOT_FOUND'
    };
  }

  const belongsToClient = await ReturnRepository.belongsToClient(idReturn, clientId);

  if (!belongsToClient) {
    return {
      success: false,
      error: 'Devolución no encontrada.',
      errorCode: 'RETURN_NOT_FOUND'
    };
  }

  const data = await ReturnRepository.findById(idReturn);

  return {
    success: true,
    data
  };
};

import { getCreditBalanceEventsUseCase } from '../use-cases/getCreditBalanceEventsUseCase.js';

export const getCreditBalanceEventsController = async (req, res) => {
  const result = await getCreditBalanceEventsUseCase({
    clientId: req.query.clientId ? Number(req.query.clientId) : null,
    limit: req.query.limit ? Number(req.query.limit) : 50
  });

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.error || 'No se pudo consultar el historial de saldo a favor.'
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data
  });
};

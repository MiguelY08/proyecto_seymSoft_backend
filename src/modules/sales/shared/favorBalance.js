import { PAYMENT_METHOD_IDS } from '../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../shared/errors/appError.js';

export const FAVOR_BALANCE_PAYMENT_METHOD_ID = PAYMENT_METHOD_IDS.FAVOR_BALANCE;

export const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

export const toMoneyCents = (value) =>
  Math.round(roundMoney(value) * 100);

export const isFavorBalancePayment = (payment = {}) =>
  Number(payment.idPaymentMethod ?? payment.id_payment_method) === FAVOR_BALANCE_PAYMENT_METHOD_ID;

export const getFavorBalancePaymentAmount = (payments = []) =>
  roundMoney(
    payments
      .filter(isFavorBalancePayment)
      .reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
      )
  );

export const assertFavorBalanceWithinAvailable = ({
  amount,
  availableBalance,
  message,
}) => {
  const value = roundMoney(amount);
  const available = roundMoney(availableBalance);

  if (value <= 0) return;

  if (toMoneyCents(value) > toMoneyCents(available)) {
    throw new AppError(
      message ||
        `El saldo a favor aplicado supera el saldo disponible del cliente. Disponible: ${available}.`,
      400
    );
  }
};

export const assertFavorBalanceWithinLimit = ({
  amount,
  limit,
  message = 'El saldo a favor aplicado no puede superar el total.',
}) => {
  const value = roundMoney(amount);
  const max = roundMoney(limit);

  if (value <= 0) return;

  if (toMoneyCents(value) > toMoneyCents(max)) {
    throw new AppError(message, 400);
  }
};

export const assertCanUseFavorBalance = ({
  amount,
  availableBalance,
  maxAmount,
  maxAmountMessage,
}) => {
  assertFavorBalanceWithinAvailable({
    amount,
    availableBalance,
  });
  assertFavorBalanceWithinLimit({
    amount,
    limit: maxAmount,
    message: maxAmountMessage,
  });
};

export const decrementClientFavorBalance = async (
  tx,
  {
    idClient,
    amount,
    insufficientMessage = 'Saldo a favor insuficiente para completar la operacion.',
  }
) => {
  const value = roundMoney(amount);

  if (value <= 0) return 0;

  const updatedBalance = await tx.clients.updateMany({
    where: {
      id_client: Number(idClient),
      credit_balance: {
        gte: value,
      },
    },
    data: {
      credit_balance: {
        decrement: value,
      },
    },
  });

  if (updatedBalance.count === 0) {
    throw new Error(insufficientMessage);
  }

  return value;
};

export const restoreClientFavorBalance = async (
  tx,
  {
    idClient,
    amount,
  }
) => {
  const value = roundMoney(amount);

  if (value <= 0) return 0;

  await tx.clients.update({
    where: {
      id_client: Number(idClient),
    },
    data: {
      credit_balance: {
        increment: value,
      },
    },
  });

  return value;
};

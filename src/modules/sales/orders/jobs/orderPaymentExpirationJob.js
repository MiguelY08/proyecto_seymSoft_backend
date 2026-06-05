import { OrderRepository } from '../repositories/orderRepository.js';
import { ProcessPendingOrderPaymentsUseCase } from '../use-cases/processPendingOrderPaymentsUseCase.js';

const DEFAULT_INTERVAL_MINUTES = 15;

let intervalRef = null;
let isRunning = false;

const getIntervalMs = () => {
  const minutes = Number(process.env.ORDER_PAYMENT_JOB_INTERVAL_MINUTES);

  return (
    !Number.isNaN(minutes) && minutes > 0
      ? minutes
      : DEFAULT_INTERVAL_MINUTES
  ) * 60 * 1000;
};

export const runOrderPaymentExpirationJob = async () => {
  if (isRunning) {
    return {
      skipped: true,
      reason: 'Job already running',
    };
  }

  isRunning = true;

  try {
    const repo = new OrderRepository();
    const useCase = new ProcessPendingOrderPaymentsUseCase(repo);
    const result = await useCase.execute();

    console.log('[OrderPaymentExpirationJob] Finished:', {
      remindersSent: result.remindersSent,
      expiredOrders: result.expiredOrders,
      errors: result.errors.length,
    });

    return result;
  } catch (error) {
    console.error(
      '[OrderPaymentExpirationJob] Error:',
      error.message
    );

    return {
      skipped: false,
      error: error.message,
    };
  } finally {
    isRunning = false;
  }
};

export const startOrderPaymentExpirationJob = () => {
  if (intervalRef) {
    return intervalRef;
  }

  const intervalMs = getIntervalMs();

  console.log('[OrderPaymentExpirationJob] Started:', {
    intervalMinutes: intervalMs / 60 / 1000,
  });

  runOrderPaymentExpirationJob();

  intervalRef = setInterval(
    runOrderPaymentExpirationJob,
    intervalMs
  );

  return intervalRef;
};

export const stopOrderPaymentExpirationJob = () => {
  if (!intervalRef) {
    return;
  }

  clearInterval(intervalRef);
  intervalRef = null;

  console.log('[OrderPaymentExpirationJob] Stopped');
};

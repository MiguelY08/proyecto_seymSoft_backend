import { PaymentsRepository } from "../repositories/PaymentsRepository.js";
import { NotifyOverdueCreditsUseCase } from "../use-cases/NotifyOverdueCreditsUseCase.js";

const DEFAULT_INTERVAL_HOURS = 24;

let intervalRef = null;
let isRunning = false;

const getIntervalMs = () => {
  const hours =
    Number(process.env.OVERDUE_CREDIT_NOTIFICATION_JOB_INTERVAL_HOURS);

  return (
    !Number.isNaN(hours) && hours > 0
      ? hours
      : DEFAULT_INTERVAL_HOURS
  ) * 60 * 60 * 1000;
};

export const runOverdueCreditNotificationJob = async () => {
  if (isRunning) {
    return {
      skipped: true,
      reason: "Job already running",
    };
  }

  isRunning = true;

  try {
    const repo = new PaymentsRepository();
    const useCase = new NotifyOverdueCreditsUseCase(repo);
    const result = await useCase.execute();

    console.log("[OverdueCreditNotificationJob] Finished:", {
      checkedReminderCredits:
        result.checkedReminderCredits,
      notifiedReminderCredits:
        result.notifiedReminderCredits,
      checkedCredits:
        result.checkedCredits,
      notifiedCredits:
        result.notifiedCredits,
      errors:
        result.errors.length,
    });

    return result;
  } catch (error) {
    console.error(
      "[OverdueCreditNotificationJob] Error:",
      error.message
    );

    return {
      skipped: false,
      error:
        error.message,
    };
  } finally {
    isRunning = false;
  }
};

export const startOverdueCreditNotificationJob = () => {
  if (intervalRef) {
    return intervalRef;
  }

  const intervalMs = getIntervalMs();

  console.log("[OverdueCreditNotificationJob] Started:", {
    intervalHours:
      intervalMs / 60 / 60 / 1000,
  });

  runOverdueCreditNotificationJob();

  intervalRef = setInterval(
    runOverdueCreditNotificationJob,
    intervalMs
  );

  return intervalRef;
};

export const stopOverdueCreditNotificationJob = () => {
  if (!intervalRef) {
    return;
  }

  clearInterval(intervalRef);
  intervalRef = null;

  console.log("[OverdueCreditNotificationJob] Stopped");
};

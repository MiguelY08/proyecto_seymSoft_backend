// Server entry point

import { env } from './config/env.js';
import app from './app.js';
import {
  startOrderPaymentExpirationJob,
  stopOrderPaymentExpirationJob,
} from './modules/sales/orders/jobs/orderPaymentExpirationJob.js';
import {
  startOverdueCreditNotificationJob,
  stopOverdueCreditNotificationJob,
} from './modules/sales/payments/jobs/overdueCreditNotificationJob.js';
// import { prisma } from './config/prisma.js';

const shouldStartOrderPaymentJob = () =>
  process.env.ORDER_PAYMENT_JOB_ENABLED !== 'false';

const shouldStartOverdueCreditNotificationJob = () =>
  process.env.OVERDUE_CREDIT_NOTIFICATION_JOB_ENABLED === 'true';

const startServer = async () => {
  try {
    // Verificar BD
    // await prisma.$connect();
    // console.log('Conectado a la base de datos');

    const server = app.listen(env.PORT, () => {
      console.log(`Servidor escuchando en el puerto ${env.PORT}`);

      if (shouldStartOrderPaymentJob()) {
        startOrderPaymentExpirationJob();
      }

      if (shouldStartOverdueCreditNotificationJob()) {
        startOverdueCreditNotificationJob();
      }
    });

    const shutdown = () => {
      stopOrderPaymentExpirationJob();
      stopOverdueCreditNotificationJob();

      server.close(() => {
        console.log('Servidor detenido correctamente');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

startServer();

// Server entry point

import { env } from './config/env.js';
import app from './app.js';
import {
  startOrderPaymentExpirationJob,
  stopOrderPaymentExpirationJob,
} from './modules/sales/orders/jobs/orderPaymentExpirationJob.js';
// import { prisma } from './config/prisma.js';

const shouldStartJobs = () =>
  process.env.ORDER_PAYMENT_JOB_ENABLED !== 'false';

const startServer = async () => {
  try {
    // Verificar BD
    // await prisma.$connect();
    // console.log('Conectado a la base de datos');

    const server = app.listen(env.PORT, () => {
      console.log(`Servidor escuchando en el puerto ${env.PORT}`);

      if (shouldStartJobs()) {
        startOrderPaymentExpirationJob();
      }
    });

    const shutdown = () => {
      stopOrderPaymentExpirationJob();

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

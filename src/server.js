// Server entry point

import app from './app.js';
import { env } from './config/env.js';
// import { prisma } from './config/prisma.js';

const startServer = async () => {
  try {
    // Verificar BD
    // await prisma.$connect();
    // console.log('Conectado a la base de datos');

    app.listen(env.PORT, () => {
      console.log(`Servidor escuchando en el puerto ${env.PORT}`);
    });
  } catch (error) {
    console.error(' Error:', error);
    process.exit(1);
  }
};

startServer();

// Server entry point

import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Servidor escuchando en el puerto ${env.PORT}`);
});

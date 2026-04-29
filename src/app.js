// Express application setup

import express from "express";
import cors from "cors";
import morgan from "morgan";

import { errorMiddleware } from "./shared/middlewares/errorMiddleware.js";
import authRoutes from "./modules/users/auth/routes/authRoutes.js";

const app = express();

/* Middlewares globales */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/* Ruta health check */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend running successfully",
  });
});

/* Rutas de autenticación */
app.use("/auth", authRoutes);

/* Middleware global de errores (siempre al final) */
app.use(errorMiddleware);

export default app;

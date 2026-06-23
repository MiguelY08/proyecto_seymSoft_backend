import express from "express";

import { CreateUserController } from "../controllers/createUserController.js";
import { GetUsersController } from "../controllers/getUsersController.js";
import { GetUserMetricsController } from "../controllers/getUserMetricsController.js"
import { GetUserByIdController } from "../controllers/getUserByIdController.js"
import { UpdateUserController } from "../controllers/updateUserController.js";
import { UpdateUserStatusController } from "../controllers/updateUserStatusController.js";
import { DeleteUserController } from "../controllers/deleteUserController.js";
import { authMiddleware } from "../../../shared/middlewares/authMiddleware.js"

const router = express.Router();

// Crear usuario
router.post("/", authMiddleware, CreateUserController);

// Obtener todos los usuarios
router.get("/", authMiddleware, GetUsersController);

// Obtener métricas de usuarios
router.get("/metrics", authMiddleware, GetUserMetricsController);

// Obtener usuario por ID
router.get("/:id", authMiddleware, GetUserByIdController);

// Actualizar usuario
router.put("/:id", authMiddleware, UpdateUserController);

// Actualizar estado
router.patch("/:id/status", authMiddleware, UpdateUserStatusController);

// Eliminar usuario
router.delete("/:id", authMiddleware, DeleteUserController);

export default router;
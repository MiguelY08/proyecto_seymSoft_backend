import express from "express";

import { CreateUserController } from "../controllers/createUserController.js";
import { GetUsersController } from "../controllers/getUsersController.js";
import { GetUserMetricsController } from "../controllers/getUserMetricsController.js"
import { GetUserByIdController } from "../controllers/getUserByIdController.js"
import { UpdateUserController } from "../controllers/updateUserController.js";
import { UpdateUserStatusController } from "../controllers/updateUserStatusController.js";
import { DeleteUserController } from "../controllers/deleteUserController.js";


const router = express.Router();

// Crear usuario
router.post("/", CreateUserController);

// Obtener todos los usuarios
router.get("/", GetUsersController);

// Obtener métricas de usuarios
router.get("/metrics", GetUserMetricsController);

// Obtener usuario por ID
router.get("/:id", GetUserByIdController);

// Actualizar usuario
router.put("/:id", UpdateUserController);

// Actualizar estado
router.patch("/:id/status", UpdateUserStatusController);

// Eliminar usuario
router.delete("/:id", DeleteUserController);


export default router;
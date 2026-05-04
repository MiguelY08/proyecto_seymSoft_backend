import express from "express";

import { CreateUserController } from "../controllers/createUserController";
import { GetUsersController } from "../controllers/getUsersController";
import { GetUserByIdController } from "../controllers/getUserByIdController"
import { UpdateUserController } from "../controllers/updateUserController";
import { UpdateUserStatusController } from "../controllers/updateUserStatusController";
import { DeleteUserController } from "../controllers/deleteUserController";


const router = express.Router();

// Crear usuario
router.post("/", CreateUserController);

// Obtener todos los usuarios
router.get("/", GetUSersController);

// Obtener usuario por ID
router.get("/:id", GetUserByIdController);

// Actualizar usuario
router.put("/:id", UpdateUserController);

// Actualizar estado
router.patch("/:id/status", UpdateUserStatusController);

// Eliminar usuario
router.delete("/:id", DeleteUserController);


export default router;
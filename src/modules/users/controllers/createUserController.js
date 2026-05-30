import { createUserUseCase } from "../use-cases/index.js";
import { validateCreateUser } from "../validators/index.js";
import { UserRepository } from "../repositories/userRepository.js";

export const CreateUserController = async (
  req,
  res
) => {
  try {
    const validation =
      validateCreateUser(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        message:
          "Errores de validación",
        errors:
          validation.errors
      });
    }

    const validatedData =
      validation.data;

    const result =
      await createUserUseCase({
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        idRole: validatedData.idRole
      });

    if (!result.success) {
      return res.status(400).json({
        message: result.error
      });
    }

    // ✅ Obtener usuario completo con rol
    const userWithRole =
      await UserRepository.getUserWithRole(
        result.data.idUser
      );

    return res.status(201).json({
      message: "Usuario creado exitosamente",
      user: userWithRole || {
        user: result.data,
        role: null,
        permissions: [],
      },
    });

  } catch(error){
    console.error(
      "[CreateUserController]",
      error
    );

    return res.status(500).json({
      message:
        "Error creando usuario"
    });
  }
};
import { createUserUseCase } from "../use-cases/index.js";
import { validateCreateUser } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";

export const CreateUserController = async (req, res) => {
  try {
    // Validar datos con Zod
    const validation = validateCreateUser(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Errores de validación.",
        errors: validation.errors,
      });
    }

    const validatedData = validation.data;

    // Ejecutar use-case
    const result = await createUserUseCase({
      docType: validatedData.docType,
      docNumber: validatedData.docNumber,
      fullName: validatedData.fullName,
      email: validatedData.email,
      password: validatedData.password,
      phone: validatedData.phone,
    });

    // Manejar diferentes tipos de error
    if (!result.success) {
      if (result.errorCode === "DUPLICATE_EMAIL") {
        return res.status(409).json({
          message: "El email ya está registrado.",
          errors: { email: "Email duplicado." },
        });
      }

      if (result.errorCode === "DUPLICATE_DOC_NUMBER") {
        return res.status(409).json({
          message: "El documento ya está registrado.",
          errors: { docNumber: "Documento duplicado." },
        });
      }

      return res.status(500).json({
        message: result.error,
      });
    }

    // Mapear respuesta
    const responseUser = UserMapper.toResponse(result.data);

    return res.status(201).json({
      message: "Usuario creado exitosamente.",
      user: responseUser,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error creando el usuario.",
    });
  }
};
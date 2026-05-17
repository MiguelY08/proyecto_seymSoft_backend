import { createUserUseCase } from "../use-cases/index.js";
import { validateCreateUser } from "../validators/index.js";
import { UserMapper } from "../mappers/usersMapper.js";

/**
 * CreateUserController
 * 
 * Responsabilidades:
 * - Validar entrada con Zod
 * - Llamar use-case de creación
 * - Manejar diferentes tipos de error
 * - Mapear respuesta
 * - Retornar HTTP response
 * 
 * Flujo:
 * 1. Validar datos (sin password - se genera en use-case)
 * 2. Llamar createUserUseCase
 * 3. Manejar resultado
 * 4. Mapear datos para respuesta
 * 5. Retornar usuario creado
 * 
 * Nota: El use-case se encarga de:
 * - Generar contraseña aleatoria
 * - Hashearla
 * - Crear usuario
 * - Enviar email de bienvenida
 */
export const CreateUserController = async (req, res) => {
  try {
    // Validar datos con Zod (sin password - se genera automáticamente)
    const validation = validateCreateUser(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Errores de validación.",
        errors: validation.errors,
      });
    }

    const validatedData = validation.data;

    // Ejecutar use-case (sin enviar password)
    const result = await createUserUseCase({
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      // Nota: password NO se envía - se genera en el use-case
    });

    // Manejar diferentes tipos de error
    if (!result.success) {
      // Email duplicado
      if (result.errorCode === "DUPLICATE_EMAIL") {
        return res.status(409).json({
          message: "El email ya está registrado.",
          errors: { email: "Email duplicado." },
        });
      }

      // Errores en generación/hasheo de contraseña
      if (
        result.errorCode === "PASSWORD_GENERATION_ERROR" ||
        result.errorCode === "PASSWORD_HASH_ERROR"
      ) {
        return res.status(500).json({
          message: "Error al procesar la contraseña del usuario.",
          error: result.error,
        });
      }

      // Error genérico
      return res.status(500).json({
        message: result.error,
      });
    }

    // Manejo especial: Usuario creado pero email falló
    if (result.errorCode === "EMAIL_SEND_ERROR") {
      const responseUser = UserMapper.toResponse(result.data);

      return res.status(201).json({
        message: "Usuario creado exitosamente, pero hubo un error al enviar el email de bienvenida.",
        warning: "El usuario deberá recibir la contraseña temporal por otro medio.",
        user: responseUser,
      });
    }

    // Éxito completo: Usuario creado + Email enviado
    const responseUser = UserMapper.toResponse(result.data);

    return res.status(201).json({
      message: "Usuario creado exitosamente. Se envió contraseña temporal al email.",
      user: responseUser,
    });

  } catch (error) {
    console.error("[CreateUserController] Error:", error);

    return res.status(500).json({
      message: "Error creando el usuario.",
    });
  }
};
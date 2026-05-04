import { UserRepository } from "../repositories/userRepository.js";

/**
 * Use-Case: Crear usuario
 * 
 * Responsabilidades:
 * - Aplicar lógica de negocio
 * - Validar que email no es duplicado
 * - Validar que documento no es duplicado
 * - Crear usuario en BD
 * - Retornar usuario creado
 * 
 * Reglas de negocio:
 * - Email DEBE ser único
 * - Número de documento DEBE ser único
 * - Contraseña DEBE estar hasheada (viene del módulo auth)
 * - Estado por defecto es 1 (Activo)
 * - Retorna el usuario creado con todos sus datos
 * 
 * Nota sobre contraseña:
 * - El módulo de acceso (auth) es responsable de hashear la contraseña
 * - Este use-case recibe la contraseña YA hasheada
 * - NO valida reglas de contraseña (eso lo hace auth)
 * 
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.docType - Tipo de documento (CC, CE, NIT, TI, PP)
 * @param {number} userData.docNumber - Número de documento (único)
 * @param {string} userData.fullName - Nombre completo
 * @param {string} userData.email - Email (único)
 * @param {string} userData.password - Contraseña hasheada
 * @param {number} userData.phone - Teléfono (opcional)
 * 
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     id: number,
 *     docType: string,
 *     docNumber: number,
 *     fullName: string,
 *     email: string,
 *     phone: number|null,
 *     creationDate: Date,
 *     statusId: number
 *   }|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 * 
 * @throws No lanza excepciones, retorna objeto de resultado
 * 
 * Códigos de error:
 * - DUPLICATE_EMAIL: Email ya existe
 * - DUPLICATE_DOC_NUMBER: Documento ya existe
 * - VALIDATION_ERROR: Error en validación de datos
 * - DATABASE_ERROR: Error en BD
 * 
 * Ejemplo de uso:
 * const result = await createUserUseCase({
 *   docType: "CC",
 *   docNumber: 1234567890,
 *   fullName: "Juan Pérez",
 *   email: "juan@example.com",
 *   password: "$2b$10$...", // ya hasheada
 *   phone: 3001234567
 * });
 * 
 * if (result.success) {
 *   console.log("Usuario creado:", result.data);
 * } else if (result.errorCode === "DUPLICATE_EMAIL") {
 *   console.log("Email ya existe");
 * } else {
 *   console.error("Error:", result.error);
 * }
 */
export const createUserUseCase = async (userData) => {
  try {
    const { docType, docNumber, fullName, email, password, phone } = userData;

    // Validar datos requeridos
    if (!docType || !docNumber || !fullName || !email || !password) {
      return {
        success: false,
        data: null,
        error: "Faltan campos obligatorios",
        errorCode: "VALIDATION_ERROR",
      };
    }

    // Validar que el email sea único
    const existingEmail = await UserRepository.findByEmail(email);

    if (existingEmail) {
      return {
        success: false,
        data: null,
        error: "El email ya está registrado",
        errorCode: "DUPLICATE_EMAIL",
      };
    }

    // Validar que el documento sea único
    const existingDocNumber = await UserRepository.findByDocNumber(docNumber);

    if (existingDocNumber) {
      return {
        success: false,
        data: null,
        error: "El documento ya está registrado",
        errorCode: "DUPLICATE_DOC_NUMBER",
      };
    }

    // Crear usuario en BD
    const newUser = await UserRepository.create({
      docType,
      docNumber,
      fullName,
      email,
      password,
      phone: phone || null,
      statusId: 1, // Por defecto: Activo
    });

    // Validar resultado de la creación
    if (!newUser) {
      return {
        success: false,
        data: null,
        error: "Error al crear el usuario en la base de datos",
        errorCode: "DATABASE_ERROR",
      };
    }

    // Validar que el usuario creado tenga los campos requeridos
    const requiredFields = [
      "id",
      "docType",
      "docNumber",
      "fullName",
      "email",
      "creationDate",
      "statusId",
    ];

    for (const field of requiredFields) {
      if (newUser[field] === undefined) {
        return {
          success: false,
          data: null,
          error: `Error: usuario creado falta campo requerido: ${field}`,
          errorCode: "DATABASE_ERROR",
        };
      }
    }

    // Validar que el estado es correcto
    if (newUser.statusId !== 1) {
      return {
        success: false,
        data: null,
        error: "Error: estado del usuario no es el esperado",
        errorCode: "DATABASE_ERROR",
      };
    }

    // Retornar usuario creado
    return {
      success: true,
      data: newUser,
      error: null,
      errorCode: null,
    };

  } catch (error) {
    // Capturar errores no esperados
    console.error("[CreateUserUseCase] Error:", error.message);

    // Intentar identificar tipo de error
    let errorCode = "DATABASE_ERROR";
    if (error.code === "P2002") {
      // Error de constraint único en Prisma
      const field = error.meta?.target?.[0];
      if (field === "email") {
        errorCode = "DUPLICATE_EMAIL";
      } else if (field === "doc_number") {
        errorCode = "DUPLICATE_DOC_NUMBER";
      }
    }

    return {
      success: false,
      data: null,
      error: "Error al crear usuario: " + error.message,
      errorCode,
    };
  }
};

/**
 * Alias (exportación alternativa para compatibilidad)
 */
export const create = createUserUseCase;
import { UserRepository } from "../repositories/userRepository.js";
import { hashPassword } from "../../../../shared/utils/hashPassword.js";
import { EmailService } from "../../../../shared/services/emailService.js";

/**
 * Genera una contraseña aleatoria de 10 caracteres
 * Incluye: mayúsculas, minúsculas y números
 * 
 * @returns {string} Contraseña aleatoria (ej: "3K9mL7x2Qw")
 */
const generateRandomPassword = () => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const allChars = uppercase + lowercase + numbers;
  
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  return password;
};

/**
 * Use-Case: Crear usuario
 * 
 * Responsabilidades:
 * - Aplicar lógica de negocio
 * - Validar que email no es duplicado
 * - Validar que documento no es duplicado
 * - GENERAR contraseña aleatoria de 10 caracteres
 * - HASHEAR la contraseña con bcrypt
 * - Crear usuario en BD
 * - ENVIAR email de bienvenida con contraseña temporal
 * - Retornar usuario creado
 * 
 * Reglas de negocio:
 * - Email DEBE ser único
 * - Número de documento DEBE ser único
 * - Contraseña se GENERA AUTOMÁTICAMENTE (10 caracteres aleatorios)
 * - Contraseña se HASHEA con bcrypt (SALT_ROUNDS = 12)
 * - Estado por defecto es 1 (Activo)
 * - Se envía email de bienvenida con contraseña temporal al usuario
 * - Retorna el usuario creado con todos sus datos
 * 
 * Nota sobre contraseña:
 * - Se GENERA: contraseña aleatoria (10 caracteres)
 * - Se HASHEA: con bcrypt (SALT_ROUNDS = 12)
 * - Se GUARDA: contraseña hasheada en BD
 * - Se ENVÍA: contraseña sin hashear al email del usuario
 * 
 * Flujo:
 * 1. Validar datos obligatorios (sin password)
 * 2. Validar email único
 * 3. Validar documento único
 * 4. GENERAR contraseña aleatoria
 * 5. HASHEAR contraseña
 * 6. CREAR usuario en BD
 * 7. ENVIAR email con contraseña temporal
 * 8. RETORNAR usuario creado
 * 
 * @param {Object} userData - Datos del usuario (SIN password)
 * @param {string} userData.docType - Tipo de documento (CC, CE, NIT, TI, PP)
 * @param {number} userData.docNumber - Número de documento (único)
 * @param {string} userData.fullName - Nombre completo
 * @param {string} userData.email - Email (único)
 * @param {number} userData.phone - Teléfono (opcional)
 * 
 * @returns {Promise<Object>} Resultado con estructura:
 * {
 *   success: boolean,
 *   data: {
 *     idUser: number,
 *     docType: string,
 *     docNumber: number,
 *     fullName: string,
 *     email: string,
 *     phone: number|null,
 *     creationDate: Date,
 *     idStatus: number
 *   }|null,
 *   error: string|null,
 *   errorCode: string|null
 * }
 * 
 * @throws No lanza excepciones, retorna objeto de resultado
 * 
 * Códigos de error:
 * - VALIDATION_ERROR: Faltan datos obligatorios
 * - DUPLICATE_EMAIL: Email ya existe
 * - DUPLICATE_DOC_NUMBER: Documento ya existe
 * - PASSWORD_GENERATION_ERROR: Error generando contraseña
 * - PASSWORD_HASH_ERROR: Error hasheando contraseña
 * - EMAIL_SEND_ERROR: Error enviando email de bienvenida
 * - DATABASE_ERROR: Error en BD
 * 
 * Ejemplo de uso:
 * const result = await createUserUseCase({
 *   docType: "CC",
 *   docNumber: 1234567890,
 *   fullName: "Juan Pérez",
 *   email: "juan@example.com",
 *   phone: 3001234567
 *   // Nota: NO se envía password, se genera automáticamente
 * });
 * 
 * if (result.success) {
 *   console.log("Usuario creado:", result.data);
 *   console.log("Email de bienvenida enviado a:", result.data.email);
 * } else if (result.errorCode === "DUPLICATE_EMAIL") {
 *   console.log("Email ya existe");
 * } else {
 *   console.error("Error:", result.error);
 * }
 */
export const createUserUseCase = async (userData) => {
  try {
    const { docType, docNumber, fullName, email, phone } = userData;

    // Validar datos requeridos (sin password - se genera automáticamente)
    if (!docType || !docNumber || !fullName || !email) {
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

    // Generar contraseña aleatoria
    let tempPassword;
    try {
      tempPassword = generateRandomPassword();
    } catch (genError) {
      return {
        success: false,
        data: null,
        error: "Error al generar contraseña: " + genError.message,
        errorCode: "PASSWORD_GENERATION_ERROR",
      };
    }

    // Hashear la contraseña generada
    let hashedPassword;
    try {
      hashedPassword = await hashPassword(tempPassword);
    } catch (hashError) {
      return {
        success: false,
        data: null,
        error: "Error al procesar la contraseña: " + hashError.message,
        errorCode: "PASSWORD_HASH_ERROR",
      };
    }

    // Crear usuario en BD
    const newUser = await UserRepository.create({
      docType,
      docNumber,
      fullName,
      email,
      password: hashedPassword,
      phone: phone || null,
      idStatus: 1, // Por defecto: Activo
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
      "idUser",
      "docType",
      "docNumber",
      "fullName",
      "email",
      "creationDate",
      "idStatus",
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
    if (newUser.idStatus !== 1) {
      return {
        success: false,
        data: null,
        error: "Error: estado del usuario no es el esperado",
        errorCode: "DATABASE_ERROR",
      };
    }

    // Enviar email de bienvenida con contraseña temporal
    try {
      await EmailService.sendWelcomeEmail(
        email,
        tempPassword,
        fullName,
        process.env.FRONTEND_URL
      );
    } catch (emailError) {
      console.error("[CreateUserUseCase] Error enviando email:", emailError.message);
      
      // Nota: El usuario fue creado exitosamente pero el email falló
      // Retornar éxito pero notificar del error de email
      return {
        success: true,
        data: newUser,
        error: "Usuario creado pero error enviando email: " + emailError.message,
        errorCode: "EMAIL_SEND_ERROR",
      };
    }

    // Retornar usuario creado exitosamente
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
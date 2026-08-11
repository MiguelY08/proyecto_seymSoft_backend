import { userErrorCodes } from "./userErrorCodes.js";

export const userErrorPublicMessages = {
  [userErrorCodes.VALIDATION_ERROR]: "Errores de validacion.",
  [userErrorCodes.INTERNAL_SERVER_ERROR]:
    "Ocurrio un error interno. Intenta de nuevo.",
  [userErrorCodes.DATABASE_ERROR]:
    "No se pudo completar la operacion. Intenta de nuevo.",
  [userErrorCodes.USER_NOT_FOUND]: "Usuario no encontrado.",
  [userErrorCodes.DUPLICATE_EMAIL]: "El email ya esta registrado.",
  [userErrorCodes.INVALID_ROLE]: "El rol seleccionado no es valido.",
  [userErrorCodes.ROLE_NOT_FOUND]: "El rol seleccionado no existe.",
  [userErrorCodes.NO_DATA_TO_UPDATE]:
    "Debe proporcionar al menos un campo para actualizar.",
  [userErrorCodes.SELF_USER_UPDATE_NOT_ALLOWED]:
    "No puedes editar tu propio usuario desde este modulo. Usa la seccion de perfil.",
  [userErrorCodes.CANNOT_UPDATE_SYSTEM_USER]:
    "No se puede actualizar el usuario del sistema.",
  [userErrorCodes.ROLE_UPDATE_ERROR]:
    "No se pudo actualizar el rol del usuario.",
  [userErrorCodes.SELF_USER_STATUS_UPDATE_NOT_ALLOWED]:
    "No puedes activar o desactivar tu propio usuario.",
  [userErrorCodes.STATUS_ALREADY_ASSIGNED]:
    "El usuario ya cuenta con ese estado.",
  [userErrorCodes.INVALID_STATUS]: "El estado solicitado no es valido.",
  [userErrorCodes.SELF_USER_DELETE_NOT_ALLOWED]:
    "No puedes eliminar tu propio usuario.",
  [userErrorCodes.CANNOT_DELETE_SYSTEM_USER]:
    "No se puede eliminar el usuario del sistema.",
  [userErrorCodes.USER_STILL_ACTIVE]:
    "El usuario debe estar inactivo para poder ser eliminado.",
  [userErrorCodes.USER_HAS_ASSIGNED_ROLES]:
    "No se puede eliminar el usuario porque tiene roles asignados.",
  [userErrorCodes.USER_HAS_ASSOCIATED_CLIENTS]:
    "No se puede eliminar el usuario porque tiene clientes asociados.",
  [userErrorCodes.USER_HAS_ASSOCIATED_RECORDS]:
    "No se puede eliminar el usuario porque tiene relaciones activas en el sistema.",
  [userErrorCodes.TRANSFER_ERROR]:
    "No se pudo completar la eliminacion del usuario por una restriccion de integridad.",
};

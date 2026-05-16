import { RoleRepository } from "../repositories/roleRepository.js";

/**
 * GET AVAILABLE PERMISSIONS USE CASE
 * 
 * Responsabilidades:
 * 1. Obtener todos los módulos disponibles
 * 2. Obtener todos los privilegios disponibles
 * 3. Retornar en formato de respuesta
 * 
 * Uso: Al crear/editar rol, el frontend necesita esta info
 *      para mostrar opciones de módulos y privilegios
 */
export class GetAvailablePermissionsUseCase {
  static async execute() {
    try {
      //  Obtener todos los módulos
      const modules = await RoleRepository.findAllModules();

      //  Obtener todos los privilegios
      const privileges = await RoleRepository.findAllPrivileges();

      //  Retornar en formato estructurado
      return {
        modules: modules.map((module) => ({
          id_module: module.id_module,
          name_module: module.name_module,
          description: module.description,
        })),
        privileges: privileges.map((privilege) => ({
          id_privilege: privilege.id_privilege,
          name_privilege: privilege.name_privilege,
          description: privilege.description,
        })),
        total_modules: modules.length,
        total_privileges: privileges.length,
      };

    } catch (error) {
      throw error;
    }
  }
}
import { RoleRepository } from "../repositories/roleRepository.js";

import { ROLE_PERMISSION_RULES }
from "../constants/rolePermissionRules.js";

export class GetAvailablePermissionsUseCase {

  static async execute() {

    // ─────────────────────────────
    // Obtener módulos
    // ─────────────────────────────

    const modules =
      await RoleRepository.findAllModules();

    // ─────────────────────────────
    // Obtener privilegios
    // ─────────────────────────────

    const privileges =
      await RoleRepository.findAllPrivileges();

    // ─────────────────────────────
    // Crear mapa rápido de privilegios
    // CREATE -> objeto privilegio
    // ─────────────────────────────

    const privilegeMap = {};

    privileges.forEach((privilege) => {

      privilegeMap[
        privilege.name_privilege
      ] = privilege;

    });

    // ─────────────────────────────
    // Construir módulos con acciones válidas
    // ─────────────────────────────

    const modulesWithActions =
      modules.map((module) => {

        const allowedPrivileges =

          ROLE_PERMISSION_RULES[
            module.name_module
          ] || [];

        const actions =

          allowedPrivileges
            .map((privilegeName) => {

              const privilege =
                privilegeMap[
                  privilegeName
                ];

              if (!privilege) {
                return null;
              }

              return {

                id_privilege:
                  privilege.id_privilege,

                name_privilege:
                  privilege.name_privilege,

                description:
                  privilege.description

              };

            })
            .filter(Boolean);

        return {

          id_module:
            module.id_module,

          name_module:
            module.name_module,

          description:
            module.description,

          actions

        };

      });

    // ─────────────────────────────
    // Return final
    // ─────────────────────────────

    return {

      modules:
        modulesWithActions,

      total_modules:
        modulesWithActions.length

    };

  }

}
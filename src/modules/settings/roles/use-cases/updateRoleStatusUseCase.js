import { RoleRepository } from "../repositories/roleRepository.js";
import { RoleMapper } from "../mappers/roleMapper.js";

import {
  NotFoundError,
  BadRequestError
} from "../../../../shared/errors/index.js";

export class UpdateRoleStatusUseCase {

  static async execute(
    id_role,
    id_status
  ){

    const currentRole =
      await RoleRepository.findRoleById(
        id_role
      );

    if(!currentRole){
      throw new NotFoundError(
        "El rol no existe"
      );
    }

    if(
      currentRole.name_role
      .toLowerCase()==="administrator"
    ){

      throw new BadRequestError(
        "No se puede cambiar el estado del rol 'Administrator'"
      );

    }

    if(
      ![1,2].includes(
        id_status
      )
    ){

      throw new BadRequestError(
        "El estado debe ser 1 (Activo) o 2 (Inactivo)"
      );

    }

    if(
      currentRole.id_status===
      id_status
    ){

      throw new BadRequestError(
        `El rol ya tiene ese estado`
      );

    }

    const updatedRole=
      await RoleRepository.updateRoleStatus(
        id_role,
        id_status
      );

    return RoleMapper.toResponseDto(
      updatedRole
    );

  }

}
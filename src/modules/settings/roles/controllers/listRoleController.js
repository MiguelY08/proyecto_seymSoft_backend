import { ListRolesUseCase } from "../use-cases/listRoleUseCase.js";

export class ListRolesController {

  static async listRoles(req,res,next){

    try{

      const includeAdmin =
        req.query.include_admin === "true";

      const roles =
        await ListRolesUseCase.execute(includeAdmin);

      return res.status(200).json({
        success:true,
        message:"Roles listados correctamente",
        data:roles,
        total:roles.length
      });

    }
    catch(error){
      next(error);
    }

  }

}
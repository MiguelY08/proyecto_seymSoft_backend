import express from "express";
import { CreateRoleController } from "../controllers/createRoleController.js";
import { ListRolesController } from "../controllers/listRoleController.js";
import { GetRoleController } from "../controllers/getRoleController.js";
import { UpdateRoleController } from "../controllers/updateRoleController.js";
import { DeleteRoleController } from "../controllers/deleteRoleController.js";
import { GetAvailablePermissionsController } from "../controllers/getAvailablePermissionsController.js";
import { UpdateRoleStatusController } from "../controllers/updateRoleStatusController.js";  
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/available-permissions",
  GetAvailablePermissionsController.getAvailablePermissions
);

router.get("/listar", ListRolesController.listRoles);

router.post("/crear", CreateRoleController.createRole);

router.get("/:id", GetRoleController.getRole);

router.put("/:id", UpdateRoleController.updateRole);

router.patch("/:id/status", UpdateRoleStatusController.updateRoleStatus);

router.delete("/:id", DeleteRoleController.deleteRole);

export default router;
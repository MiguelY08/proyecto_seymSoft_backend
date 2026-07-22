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
  "/available-permissions", authMiddleware,
  GetAvailablePermissionsController.getAvailablePermissions
);

router.get("/listar", authMiddleware, ListRolesController.listRoles);

router.post("/crear",  authMiddleware, CreateRoleController.createRole);

router.get("/:id",  authMiddleware, GetRoleController.getRole);

router.put("/:id",  authMiddleware, UpdateRoleController.updateRole);

router.patch("/:id/status",  authMiddleware, UpdateRoleStatusController.updateRoleStatus);

router.delete("/:id",  authMiddleware, DeleteRoleController.deleteRole);

export default router;
import { prisma } from "../../config/prisma.js";
import { AppError } from "../errors/appError.js";

const ACTIVE_STATUS_ID = 1;

export const requirePermission = (moduleName, privilegeName) =>
  async (req, res, next) => {
    try {
      const idUser = Number(req.user?.id_user);

      if (!Number.isInteger(idUser) || idUser <= 0) {
        throw new AppError("Usuario no autenticado.", 401);
      }

      const employee = await prisma.employees.findUnique({
        where: { id_user: idUser },
        select: {
          employee_roles: {
            select: {
              id_role: true,
              roles: {
                select: {
                  id_status: true,
                },
              },
            },
          },
        },
      });

      const idRole =
        employee?.employee_roles?.id_role;

      if (!idRole) {
        throw new AppError("No tienes permiso para realizar esta accion.", 403);
      }

      const roleStatus =
        employee?.employee_roles?.roles?.id_status;

      if (Number(roleStatus) !== ACTIVE_STATUS_ID) {
        throw new AppError("Tu rol se encuentra inactivo.", 403);
      }

      const [moduleRecord, privilegeRecord] = await Promise.all([
        prisma.modules.findUnique({
          where: { name_module: moduleName },
          select: { id_module: true },
        }),
        prisma.privileges.findUnique({
          where: { name_privilege: privilegeName },
          select: { id_privilege: true },
        }),
      ]);

      if (!moduleRecord || !privilegeRecord) {
        throw new AppError("El permiso solicitado no esta configurado.", 403);
      }

      const permission = await prisma.assigned_permissions.findUnique({
        where: {
          id_role_id_module_id_privilege: {
            id_role: idRole,
            id_module: moduleRecord.id_module,
            id_privilege: privilegeRecord.id_privilege,
          },
        },
        select: { id_permission: true },
      });

      if (!permission) {
        throw new AppError("No tienes permiso para realizar esta accion.", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };

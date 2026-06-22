import { prisma } from "../../../../config/prisma.js";
import { AppError } from "../../../../shared/errors/index.js";

export const requireAuthenticatedClient = async (req, res, next) => {
  try {
    const idUser = req.user?.id_user;
    if (!idUser) throw new AppError("Usuario no autenticado", 401);

    const client = await prisma.clients.findUnique({
      where: { id_user: idUser },
      select: { id_client: true, client_type: true },
    });

    if (!client) {
      throw new AppError(
        "La cuenta autenticada no tiene un cliente asociado",
        403,
      );
    }

    req.client = {
      idClient: client.id_client,
      clientType: client.client_type,
    };
    next();
  } catch (error) {
    next(error);
  }
};

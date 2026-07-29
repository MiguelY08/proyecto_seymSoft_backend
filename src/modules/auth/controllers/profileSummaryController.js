import { NotFoundError } from "../../../shared/errors/index.js";
import { AuthProfileRepository } from "../repositories/authProfileRepository.js";
import { GetProfileSummaryUseCase } from "../use-cases/GetProfileSummaryUseCase.js";
import { validateProfileSummaryRequest } from "../validators/profileSummaryValidator.js";

const repository =
  new AuthProfileRepository();

const getProfileSummaryUseCase =
  new GetProfileSummaryUseCase({
    repository,
  });

export class ProfileSummaryController {
  static async getSummary(
    req,
    res,
    next
  ) {
    try {
      const idUser =
        req.user?.id_user;

      if (!idUser) {
        throw new NotFoundError(
          "Usuario no autenticado"
        );
      }

      validateProfileSummaryRequest({
        idUser,
      });

      const data =
        await getProfileSummaryUseCase.execute(
          idUser
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

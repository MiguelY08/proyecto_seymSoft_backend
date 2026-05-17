import { ProfileUseCase } from "../use-cases/profileUseCase.js";
import { authMiddleware } from "../../../shared/middlewares/authMiddleware.js";

export class ProfileController {
  static async getProfile(req, res, next) {
    try {
      const { id_user } = req.user;

      const user = await ProfileUseCase.execute(id_user);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

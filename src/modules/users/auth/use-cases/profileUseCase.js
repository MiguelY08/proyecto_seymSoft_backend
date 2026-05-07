import { AuthRepository } from "../repositories/authRepository.js";
import { UserMapper } from "../../users/mappers/userMapper.js";
import { NotFoundError } from "../../../../shared/errors/index.js";

export class ProfileUseCase {
  static async execute(idUser) {
    const user = await AuthRepository.findUserById(idUser);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return UserMapper.toCleanUser(user);
  }
}

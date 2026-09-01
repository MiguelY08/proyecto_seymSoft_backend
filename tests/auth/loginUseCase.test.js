import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { LoginUseCase } from "../../src/modules/auth/use-cases/loginUseCase.js";
import { AuthRepository } from "../../src/modules/auth/repositories/authRepository.js";
import { UserRepository } from "../../src/modules/users/repositories/userRepository.js";
import { hashPassword } from "../../src/shared/utils/hashPassword.js";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../src/shared/errors/index.js";

process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret";

const originalAuthRepository = {
  findUserByEmail: AuthRepository.findUserByEmail,
  createRefreshToken: AuthRepository.createRefreshToken,
};

const originalUserRepository = {
  getUserWithRole: UserRepository.getUserWithRole,
};

const restoreRepositories = () => {
  Object.assign(AuthRepository, originalAuthRepository);
  Object.assign(UserRepository, originalUserRepository);
};

test("LoginUseCase rechaza usuario inexistente", async () => {
  AuthRepository.findUserByEmail = async () => null;

  try {
    await assert.rejects(
      () =>
        LoginUseCase.execute({
          email: "no-existe@example.com",
          pass_word: "Password1",
        }),
      NotFoundError,
    );
  } finally {
    restoreRepositories();
  }
});

test("LoginUseCase rechaza usuario inactivo antes de validar contrasena", async () => {
  const hashedPassword = await hashPassword("Password1");
  let createdRefreshToken = false;

  AuthRepository.findUserByEmail = async () => ({
    id_user: 9,
    email: "inactivo@example.com",
    pass_word: hashedPassword,
    id_status: 2,
    token_version: 0,
  });
  AuthRepository.createRefreshToken = async () => {
    createdRefreshToken = true;
  };

  try {
    await assert.rejects(
      () =>
        LoginUseCase.execute({
          email: "inactivo@example.com",
          pass_word: "Password1",
        }),
      UnauthorizedError,
    );

    assert.equal(createdRefreshToken, false);
  } finally {
    restoreRepositories();
  }
});

test("LoginUseCase rechaza contrasena incorrecta", async () => {
  const hashedPassword = await hashPassword("Password1");

  AuthRepository.findUserByEmail = async () => ({
    id_user: 10,
    email: "miguel@example.com",
    pass_word: hashedPassword,
    id_status: 1,
    token_version: 0,
  });

  try {
    await assert.rejects(
      () =>
        LoginUseCase.execute({
          email: "miguel@example.com",
          pass_word: "OtraPassword1",
        }),
      UnauthorizedError,
    );
  } finally {
    restoreRepositories();
  }
});

test("LoginUseCase exitoso devuelve tokens, permisos y guarda refresh token", async () => {
  const hashedPassword = await hashPassword("Password1");
  let persistedRefreshToken = null;

  AuthRepository.findUserByEmail = async () => ({
    id_user: 11,
    email: "miguel@example.com",
    pass_word: hashedPassword,
    id_status: 1,
    token_version: 3,
  });
  AuthRepository.createRefreshToken = async (
    idUser,
    refreshToken,
    expirationDate,
  ) => {
    persistedRefreshToken = {
      idUser,
      refreshToken,
      expirationDate,
    };
  };
  UserRepository.getUserWithRole = async () => ({
    user: {
      id_user: 11,
      email: "miguel@example.com",
      full_name: "Miguel Angel",
    },
    role: {
      id_role: 1,
      name_role: "Administrador",
    },
    client: null,
    permissions: [
      {
        idPermission: 7,
        idModule: 2,
        module: "Ventas",
        idPrivilege: 1,
        privilege: "CREATE",
      },
    ],
  });

  try {
    const result = await LoginUseCase.execute({
      email: "miguel@example.com",
      pass_word: "Password1",
    });

    const decodedAccessToken = jwt.decode(result.accessToken);
    const decodedRefreshToken = jwt.decode(result.refreshToken);

    assert.equal(result.user.id_user, 11);
    assert.equal(result.role.name_role, "Administrador");
    assert.deepEqual(result.permissions, [
      {
        idPermission: 7,
        idModule: 2,
        module: "Ventas",
        idPrivilege: 1,
        privilege: "CREATE",
      },
    ]);
    assert.equal(decodedAccessToken.id_user, 11);
    assert.equal(decodedAccessToken.email, "miguel@example.com");
    assert.equal(decodedAccessToken.tokenVersion, 3);
    assert.equal(decodedRefreshToken.type, "refresh");
    assert.equal(persistedRefreshToken.idUser, 11);
    assert.equal(persistedRefreshToken.refreshToken, result.refreshToken);
    assert.ok(persistedRefreshToken.expirationDate instanceof Date);
  } finally {
    restoreRepositories();
  }
});


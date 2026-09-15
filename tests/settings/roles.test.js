import test from "node:test";
import assert from "node:assert/strict";

import {
  createRoleSchema,
  updateRoleSchema,
} from "../../src/modules/settings/roles/validators/roleValidators.js";
import { UpdateRoleUseCase } from "../../src/modules/settings/roles/use-cases/updateRoleUseCase.js";
import { RoleRepository } from "../../src/modules/settings/roles/repositories/roleRepository.js";

const validPermissions = [
  {
    id_module: 1,
    id_privilege: 1,
  },
];

const validRole = {
  id_role: 7,
  name_role: "Vendedor",
  description: "Rol de ventas",
  date_creation: new Date("2026-01-01"),
  id_status: 1,
  assigned_permissions: validPermissions.map((permission, index) => ({
    id_permission: index + 1,
    id_role: 7,
    ...permission,
    modules: {
      id_module: permission.id_module,
      name_module: "Usuarios",
      description: null,
    },
    privileges: {
      id_privilege: permission.id_privilege,
      name_privilege: "CREATE",
      description: null,
    },
  })),
  general_statuses: {
    id_status: 1,
    name_status: "Activo",
  },
};

const tooLongDescription =
  "Esta descripcion supera claramente cincuenta caracteres";

test("role validators reject descriptions longer than the roles table allows", () => {
  const createResult = createRoleSchema.safeParse({
    name_role: "Vendedor",
    description: tooLongDescription,
    permissions: validPermissions,
  });
  const updateResult = updateRoleSchema.safeParse({
    name_role: "Vendedor",
    description: tooLongDescription,
    permissions: validPermissions,
  });

  assert.equal(createResult.success, false);
  assert.equal(updateResult.success, false);
  assert.match(
    createResult.error.issues[0].message,
    /50 caracteres/,
  );
  assert.match(
    updateResult.error.issues[0].message,
    /50 caracteres/,
  );
});

test("UpdateRoleUseCase updates roles without rejecting permissions used by another role", async () => {
  const originals = {
    findRoleById: RoleRepository.findRoleById,
    findRoleByNameInsensitive: RoleRepository.findRoleByNameInsensitive,
    findModulesByIds: RoleRepository.findModulesByIds,
    findPrivilegesByIds: RoleRepository.findPrivilegesByIds,
    findPermissionConflicts: RoleRepository.findPermissionConflicts,
    updateRolePermissionsTransaction:
      RoleRepository.updateRolePermissionsTransaction,
  };

  RoleRepository.findRoleById = async () => validRole;
  RoleRepository.findRoleByNameInsensitive = async () => null;
  RoleRepository.findModulesByIds = async () => [
    {
      id_module: 1,
      name_module: "Usuarios",
      description: null,
    },
  ];
  RoleRepository.findPrivilegesByIds = async () => [
    {
      id_privilege: 1,
      name_privilege: "CREATE",
      description: null,
    },
  ];
  RoleRepository.findPermissionConflicts = async () => {
    throw new Error("No debe validar conflictos globales al editar");
  };
  RoleRepository.updateRolePermissionsTransaction = async () => validRole;

  try {
    const result = await UpdateRoleUseCase.execute(7, {
      name_role: "Vendedor Pro",
      description: "Rol de ventas",
      permissions: validPermissions,
    });

    assert.equal(result.id_role, 7);
    assert.equal(result.name_role, "Vendedor");
  } finally {
    Object.assign(RoleRepository, originals);
  }
});

test("UpdateRoleUseCase preserves current permissions when edit payload omits permissions", async () => {
  const originals = {
    findRoleById: RoleRepository.findRoleById,
    findRoleByNameInsensitive: RoleRepository.findRoleByNameInsensitive,
    findModulesByIds: RoleRepository.findModulesByIds,
    findPrivilegesByIds: RoleRepository.findPrivilegesByIds,
    updateRolePermissionsTransaction:
      RoleRepository.updateRolePermissionsTransaction,
  };
  let persistedPermissions = null;

  RoleRepository.findRoleById = async () => validRole;
  RoleRepository.findRoleByNameInsensitive = async () => null;
  RoleRepository.findModulesByIds = async () => [
    {
      id_module: 1,
      name_module: "Usuarios",
      description: null,
    },
  ];
  RoleRepository.findPrivilegesByIds = async () => [
    {
      id_privilege: 1,
      name_privilege: "CREATE",
      description: null,
    },
  ];
  RoleRepository.updateRolePermissionsTransaction = async (
    idRole,
    roleData,
    permissions,
  ) => {
    persistedPermissions = permissions;
    return {
      ...validRole,
      id_role: idRole,
      name_role: roleData.name_role,
    };
  };

  try {
    await UpdateRoleUseCase.execute(7, {
      name_role: "Vendedor Pro",
      description: "Rol de ventas",
      permissions: [],
    });

    assert.deepEqual(persistedPermissions, [
      {
        id_role: 7,
        id_module: 1,
        id_privilege: 1,
      },
    ]);
  } finally {
    Object.assign(RoleRepository, originals);
  }
});

test("ValidateRoleUseCase rejects an exact permission set and excludes the edited role", async () => {
  const original = RoleRepository.findExactPermissionSetConflicts;
  const calls = [];

  RoleRepository.findExactPermissionSetConflicts = async (permissions, idRole) => {
    calls.push({ permissions, idRole });
    return idRole === 7 ? [] : [{ id_role: 8, name_role: "Empleado" }];
  };

  try {
    const { ValidateRoleUseCase } = await import(
      "../../src/modules/settings/roles/use-cases/validateRoleUseCase.js"
    );

    const editing = await ValidateRoleUseCase.validatePermissions(
      validPermissions,
      7,
    );
    const creating = await ValidateRoleUseCase.validatePermissions(
      validPermissions,
    );

    assert.equal(editing.valid, true);
    assert.equal(creating.valid, false);
    assert.deepEqual(calls.map((call) => call.idRole), [7, null]);
  } finally {
    RoleRepository.findExactPermissionSetConflicts = original;
  }
});

test("CreateRoleUseCase rejects an exact permission set already used by another role", async () => {
  const originals = {
    findRoleByNameInsensitive: RoleRepository.findRoleByNameInsensitive,
    findModulesByIds: RoleRepository.findModulesByIds,
    findPrivilegesByIds: RoleRepository.findPrivilegesByIds,
    findExactPermissionSetConflicts:
      RoleRepository.findExactPermissionSetConflicts,
  };

  RoleRepository.findRoleByNameInsensitive = async () => null;
  RoleRepository.findModulesByIds = async () => [
    { id_module: 1, name_module: "Usuarios", description: null },
  ];
  RoleRepository.findPrivilegesByIds = async () => [
    { id_privilege: 1, name_privilege: "CREATE", description: null },
  ];
  RoleRepository.findExactPermissionSetConflicts = async () => [
    { id_role: 8, name_role: "Empleado" },
  ];

  try {
    const { CreateRoleUseCase } = await import(
      "../../src/modules/settings/roles/use-cases/createRoleUseCase.js"
    );

    await assert.rejects(
      CreateRoleUseCase.execute({
        name_role: "Nuevo Rol",
        description: "Rol de prueba",
        permissions: validPermissions,
      }),
      { name: "ConflictError", statusCode: 409 },
    );
  } finally {
    Object.assign(RoleRepository, originals);
  }
});

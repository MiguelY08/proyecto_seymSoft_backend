import { PrismaClient } from "@prisma/client";
import { ROLE_PERMISSION_RULES } 
from "../src/modules/settings/roles/constants/rolePermissionRules.js";
import { hashPassword } from "../src/shared/utils/hashPassword.js";
import { DEFAULT_ADMIN_EMAIL } from "../src/shared/constants/defaultAdminUser.js";


const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Iniciando seed...\n");

    // ==================== ESTADOS ====================

    const statuses = [
      { id_status: 1, name_status: "Activo" },
      { id_status: 2, name_status: "Inactivo" },
    ];

    for (const status of statuses) {
      await prisma.general_statuses.upsert({
        where: { id_status: status.id_status },
        update: {},
        create: status,
      });
    }

    console.log("✅ Estados creados");

    // ==================== MÓDULOS ====================

    const modules = [
      ["Usuarios","Gestión de usuarios del sistema"],
      ["Roles","Gestión de roles y permisos"],
      ["Clientes","Gestión de clientes"],
      ["Productos","Gestión de productos"],
      ["Categorias","Gestión de categorías y subcategorías"],
      ["Proveedores","Gestión de proveedores"],
      ["Compras","Gestión de compras"],
      ["Producto_no_conforme","Gestión de productos no conformes"],
      ["Pedidos","Gestión de pedidos"],
      ["Ventas","Gestión de ventas"],
      ["Devoluciones_en_ventas","Gestión de devoluciones en ventas"],
      ["Pagos_y_abonos","Gestión de pagos y abonos"],
      ["Banners","Gestión de banners"],
      ["Devoluciones_en_compras","Gestión de devoluciones en compras"],
      ["Dashboard","Dashboard y reportes generales"],
    ];

    const createdModules=[];

    for(const [name_module,description] of modules){

      const module=await prisma.modules.upsert({
        where:{name_module},
        update:{},
        create:{
          name_module,
          description
        }
      });

      createdModules.push(module);
    }

    console.log(`✅ ${createdModules.length} módulos creados`);

    // ==================== PRIVILEGIOS ====================

    // ✅ REMOVER DUPLICADO DE "DESCARGAR"
    const privileges = [
  ["CREATE","Crear registros"],
  ["READ","Ver listado completo"],
  ["READ_DETAIL","Ver información detallada de un registro"],
  ["UPDATE","Editar registros"],
  ["DELETE","Eliminar registros"],
  ["ACTIVATE_DEACTIVATE","Activar y desactivar registros"],
  ["EXPORT","Descargar y exportar datos"],
  ["DESCARGAR","Descargar archivos"],  // ← ¿ESTÁ AQUÍ?
  ["ABONAR","Registrar abonos en pagos"],
  ["CONTACTAR","Contactar clientes"],
  ["GENERAR_INTERES","Generar intereses en pagos"],
  ["ANULAR","Anular registros"],
  ["DEVOLVER","Procesar devoluciones"],
  ["CREAR_DEVOLUCION","Crear devoluciones"],
  ["ORDENAR","Ordenar elementos"],
  ["SUBIR_IMAGEN","Subir imágenes"],
  ["AMPLIAR_IMAGEN", "Ampliar imagenes o detalles"]
];

    const createdPrivileges=[];

    for(const [name_privilege,description] of privileges){

      const privilege=
      await prisma.privileges.upsert({
        where:{name_privilege},
        update:{},
        create:{
          name_privilege,
          description
        }
      });

      createdPrivileges.push(privilege);

    }

    console.log(`✅ ${createdPrivileges.length} privilegios creados`);

    // ==================== ADMIN ====================

    const adminRole=await prisma.roles.upsert({
      where:{
        name_role:"Administrator"
      },
      update:{},
      create:{
        name_role:"Administrator",
        description:"Acceso completo al sistema",
        id_status:1,
        date_creation:new Date()
      }
    });

    console.log("✅ Rol Administrator creado");

    // ==================== USUARIO ADMIN POR DEFECTO ====================

    const defaultAdminPassword = await hashPassword(
      "adminPapeleriaMagic2026"
    );

    const defaultAdminUser = await prisma.users.upsert({
      where: {
        email: DEFAULT_ADMIN_EMAIL,
      },
      update: {
        full_name: "Administrador SeymSoft",
        pass_word: defaultAdminPassword,
        id_status: 1,
      },
      create: {
        full_name: "Administrador SeymSoft",
        email: DEFAULT_ADMIN_EMAIL,
        pass_word: defaultAdminPassword,
        id_status: 1,
        token_version: 0,
      },
    });

    const defaultAdminEmployee = await prisma.employees.upsert({
      where: {
        id_user: defaultAdminUser.id_user,
      },
      update: {
        id_status: 1,
      },
      create: {
        id_user: defaultAdminUser.id_user,
        id_status: 1,
      },
    });

    await prisma.employee_roles.upsert({
      where: {
        id_employee: defaultAdminEmployee.id_employee,
      },
      update: {
        id_role: adminRole.id_role,
      },
      create: {
        id_employee: defaultAdminEmployee.id_employee,
        id_role: adminRole.id_role,
      },
    });

    console.log("Usuario administrador por defecto creado");

    // ==================== ASIGNAR PERMISOS ====================

    // ✅ CREAR MAPA DE PRIVILEGIOS PARA BÚSQUEDA RÁPIDA
    const privilegeMap = new Map();
    createdPrivileges.forEach(p => {
      privilegeMap.set(p.name_privilege, p.id_privilege);
    });

    const moduleMap = new Map();
    createdModules.forEach(m => {
      moduleMap.set(m.name_module, m.id_module);
    });

    // ✅ CONTAR PERMISOS CREADOS
    let permissionCount = 0;

    // Iterar por cada módulo
    for (const module of createdModules) {

      // Obtener permisos válidos para este módulo
      const validPermissions =
        ROLE_PERMISSION_RULES[module.name_module] || [];

      console.log(
        `  Módulo: ${module.name_module} - ${validPermissions.length} permisos`
      );

      // Asignar cada permiso válido al rol Administrator
      for (const privilegeName of validPermissions) {

        const id_privilege = privilegeMap.get(privilegeName);

        if (!id_privilege) {
          console.warn(
            `    ⚠️ Privilegio no encontrado: ${privilegeName}`
          );
          continue;
        }

        await prisma.assigned_permissions.upsert({
          where: {
            id_role_id_module_id_privilege: {
              id_role: adminRole.id_role,
              id_module: module.id_module,
              id_privilege: id_privilege,
            },
          },
          update: {},
          create: {
            id_role: adminRole.id_role,
            id_module: module.id_module,
            id_privilege: id_privilege,
          },
        });

        permissionCount++;
      }
    }

    console.log(`✅ ${permissionCount} permisos asignados al Administrator`);

    console.log("\n✅ Seed completado exitosamente");

  } catch(error){

    console.error("❌ Error en seed:", error);
    process.exitCode = 1;

  } finally{

    await prisma.$disconnect();

  }

}

main();

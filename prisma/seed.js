import { PrismaClient } from "../generated/prisma/index.js";
import { ROLE_PERMISSION_RULES } 
from "../src/features/roles/constants/rolePermissionRules.js";

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

    console.log("Estados creados");

    // ==================== MÓDULOS ====================

    const modules = [
      ["Usuarios","Gestión de usuarios"],
      ["Roles","Gestión de roles"],
      ["Clientes","Gestión de clientes"],
      ["Productos","Gestión de productos"],
      ["Categorias","Gestión categorías"],
      ["Proveedores","Gestión proveedores"],
      ["Compras","Gestión compras"],
      ["Producto_no_conforme","Productos no conformes"],
      ["Pedidos","Gestión pedidos"],
      ["Ventas","Gestión ventas"],
      ["Devoluciones_en_ventas","Devoluciones ventas"],
      ["Pagos_y_abonos","Pagos y abonos"],
      ["Banners","Gestión banners"],
      ["Devoluciones_en_compras","Devoluciones compras"],
      ["Dashboard","Dashboard"],
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

    console.log(`${createdModules.length} módulos creados`);

    // ==================== PRIVILEGIOS ====================

    const privileges = [
      ["CREATE","Crear registros"],
      ["READ","Ver listado"],
      ["READ_DETAIL","Ver detalle"],
      ["UPDATE","Editar"],
      ["DELETE","Eliminar"],
      ["ACTIVATE_DEACTIVATE","Activar/desactivar"],
      ["EXPORT","Exportar datos"],
      ["DESCARGAR","Descargar archivos"],
      ["ABONAR","Registrar abonos"],
      ["CONTACTAR","Contactar"],
      ["GENERAR_INTERES","Generar intereses"],
      ["ANULAR","Anular"],
      ["DEVOLVER","Devolver"],
      ["CREAR_DEVOLUCION","Crear devolución"],
      ["ORDENAR","Ordenar"],
      ["SUBIR_IMAGEN","Subir imágenes"]
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

    console.log(`${createdPrivileges.length} privilegios creados`);

    // ==================== ADMIN ====================

    const adminRole=await prisma.roles.upsert({
      where:{
        name_role:"Administrator"
      },
      update:{},
      create:{
        name_role:"Administrator",
        description:"Acceso completo",
        id_status:1,
        date_creation:new Date()
      }
    });

    console.log("Administrator creado");

    // ==================== REGLAS ====================

    const restrictedPermissions={

      ORDENAR:["Banners"],

      SUBIR_IMAGEN:["Banners"],

      ABONAR:["Pagos_y_abonos"],

      CONTACTAR:["Pagos_y_abonos"],

      GENERAR_INTERES:["Pagos_y_abonos"],

      DEVOLVER:["Compras"],

      CREAR_DEVOLUCION:[
        "Devoluciones_en_ventas"
      ],

      ANULAR:[
        "Compras",
        "Pedidos",
        "Ventas",
        "Devoluciones_en_ventas",
        "Devoluciones_en_compras"
      ]
    };

    const permissions=[];

    for (const module of createdModules) {

  const validPermissions =
    ROLE_PERMISSION_RULES[module.name_module] || [];

      for (const privilege of createdPrivileges) {

        const isAllowed =
          validPermissions.includes(
            privilege.name_privilege
          );

        if (!isAllowed) {
          continue;
        }

        await prisma.assigned_permissions.upsert({
          where: {
            id_role_id_module_id_privilege: {
              id_role: adminRole.id_role,
              id_module: module.id_module,
              id_privilege: privilege.id_privilege,
            },
          },
          update: {},
          create: {
            id_role: adminRole.id_role,
            id_module: module.id_module,
            id_privilege: privilege.id_privilege,
          },
        });

        permissionCount++;
      }
    }

    await prisma.assigned_permissions.createMany({

      data:permissions,
      skipDuplicates:true

    });

    console.log(
      `${permissions.length} permisos asignados`
    );

    console.log("\nSeed completado");

  } catch(error){

    console.error(error);

  } finally{

    await prisma.$disconnect();

  }

}

main();
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * SEED DATA SIMPLIFICADO
 * 
 * Crea:
 * 1. 2 Estados (Activo, Inactivo)
 * 2. 15 Módulos
 * 3. 15 Privilegios
 * 4. Rol Administrator con TODOS los permisos
 */

async function main() {
  try {
    console.log(" Iniciando seed...\n");

    // ==================== 1. CREAR ESTADOS ====================
    console.log(" Creando estados...");

    // Estado Activo (id_status: 1)
    const activeStatus = await prisma.general_statuses.upsert({
      where: { id_status: 1 },
      update: {},
      create: {
        name_status: "Activo"
      },
    });

    // Estado Inactivo (id_status: 2)
    const inactiveStatus = await prisma.general_statuses.upsert({
      where: { id_status: 2 },
      update: {},
      create: {
        name_status: "Inactivo"
      },
    });

    console.log(" Estados creados:\n");
    console.log(`   - ${activeStatus.name_status} (ID: ${activeStatus.id_status})`);
    console.log(`   - ${inactiveStatus.name_status} (ID: ${inactiveStatus.id_status})\n`);

    // ==================== 2. CREAR MÓDULOS ====================
    console.log(" Creando módulos del sistema...");

    const modules = [
      { name_module: "Usuarios", description: "Gestión de usuarios del sistema" },
      { name_module: "Roles", description: "Gestión de roles y permisos" },
      { name_module: "Clientes", description: "Gestión de clientes" },
      { name_module: "Productos", description: "Gestión de productos" },
      { name_module: "Categorias", description: "Gestión de categorías y subcategorías" },
      { name_module: "Proveedores", description: "Gestión de proveedores" },
      { name_module: "Compras", description: "Gestión de compras" },
      { name_module: "Producto_no_conforme", description: "Gestión de productos no conformes" },
      { name_module: "Pedidos", description: "Gestión de pedidos" },
      { name_module: "Ventas", description: "Gestión de ventas" },
      { name_module: "Devoluciones_en_ventas", description: "Gestión de devoluciones en ventas" },
      { name_module: "Pagos_y_abonos", description: "Gestión de pagos y abonos" },
      { name_module: "Banners", description: "Gestión de banners" },
      { name_module: "Devoluciones_en_compras", description: "Gestión de devoluciones en compras" },
      { name_module: "Dashboard", description: "Dashboard y reportes generales" },
    ];

    const createdModules = [];
    for (const module of modules) {
      const created = await prisma.modules.upsert({
        where: { name_module: module.name_module },
        update: {},
        create: module,
      });
      createdModules.push(created);
    }

    console.log(`${createdModules.length} módulos creados\n`);

    // ==================== 3. CREAR PRIVILEGIOS ====================
    console.log(" Creando privilegios...");

    const privileges = [
      { name_privilege: "CREATE", description: "Crear registros" },
      { name_privilege: "READ", description: "Ver listado completo" },
      { name_privilege: "READ_DETAIL", description: "Ver información detallada de un registro" },
      { name_privilege: "UPDATE", description: "Editar registros" },
      { name_privilege: "DELETE", description: "Eliminar registros" },
      { name_privilege: "ACTIVATE_DEACTIVATE", description: "Activar y desactivar registros" },
      { name_privilege: "EXPORT", description: "Descargar y exportar datos" },
      { name_privilege: "ABONAR", description: "Registrar abonos en pagos" },
      { name_privilege: "CONTACTAR", description: "Contactar clientes" },
      { name_privilege: "GENERAR_INTERES", description: "Generar intereses en pagos" },
      { name_privilege: "ANULAR", description: "Anular registros" },
      { name_privilege: "DEVOLVER", description: "Procesar devoluciones" },
      { name_privilege: "CREAR_DEVOLUCION", description: "Crear devoluciones" },
      { name_privilege: "ORDENAR", description: "Ordenar elementos" },
      { name_privilege: "SUBIR_IMAGEN", description: "Subir imágenes" },
    ];

    const createdPrivileges = [];
    for (const privilege of privileges) {
      const created = await prisma.privileges.upsert({
        where: { name_privilege: privilege.name_privilege },
        update: {},
        create: privilege,
      });
      createdPrivileges.push(created);
    }

    console.log(` ${createdPrivileges.length} privilegios creados\n`);

    // ==================== 4. CREAR ROL ADMINISTRATOR ====================
    console.log(" Creando rol Administrator...");

    const adminRole = await prisma.roles.upsert({
      where: { name_role: "Administrator" },
      update: {},
      create: {
        name_role: "Administrator",
        description: "Rol administrador con acceso a todo el sistema",
        id_status: 1,
        date_creation: new Date(),
      },
    });

    console.log(`Rol Administrator creado (ID: ${adminRole.id_role})\n`);

    // ==================== 5. ASIGNAR TODOS LOS PERMISOS AL ADMIN ====================
    console.log(" Asignando permisos al rol Administrator...");

    let permissionCount = 0;
    for (const module of createdModules) {
      for (const privilege of createdPrivileges) {
        // Validaciones de sentido lógico
        if (privilege.name_privilege === "ORDENAR" && module.name_module !== "Banners") {
          continue;
        }

        if (privilege.name_privilege === "SUBIR_IMAGEN" && module.name_module !== "Banners") {
          continue;
        }

        if (
          ["ABONAR", "CONTACTAR", "GENERAR_INTERES"].includes(privilege.name_privilege) &&
          module.name_module !== "Pagos_y_abonos"
        ) {
          continue;
        }

        if (
          privilege.name_privilege === "ANULAR" &&
          !["Compras", "Devoluciones_en_ventas", "Devoluciones_en_compras", "Pedidos", "Ventas"].includes(module.name_module)
        ) {
          continue;
        }

        if (privilege.name_privilege === "DEVOLVER" && module.name_module !== "Compras") {
          continue;
        }

        if (privilege.name_privilege === "CREAR_DEVOLUCION" && module.name_module !== "Devoluciones_en_ventas") {
          continue;
        }

        // Crear permiso asignado
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

    console.log(` ${permissionCount} permisos asignados al rol Administrator\n`);

    // ==================== RESUMEN ====================
    console.log("\n ¡SEED COMPLETADO EXITOSAMENTE!\n");
    console.log(" RESUMEN:");
    console.log(`   - Estados: 2 (Activo, Inactivo)`);
    console.log(`   - Módulos: ${createdModules.length}`);
    console.log(`   - Privilegios: ${createdPrivileges.length}`);
    console.log(`   - Rol Administrator creado`);
    console.log(`   - Permisos asignados: ${permissionCount}`);
    console.log("\n PRÓXIMOS PASOS:");
    console.log("   1. Crear usuario admin vía endpoint /api/auth/register");
    console.log("   2. Crear módulo de usuarios para asignar roles");
    console.log("   3. Probar endpoints de roles\n");

  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
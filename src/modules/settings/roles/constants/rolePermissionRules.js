/**
 * ROLE PERMISSION RULES
 *
 * Define qué privilegios son válidos para cada módulo.
 *
 * Organización:
 * 1. Gestión de Usuarios y Roles (CRUD completo)
 * 2. Gestión de Entidades (CRUD completo)
 * 3. Gestión de Inventario
 * 4. Operaciones de Compra
 * 5. Operaciones de Venta
 * 6. Devoluciones
 * 7. Finanzas
 * 8. Contenido
 * 9. Reportes
 *
 * Se reutiliza en:
 * - CreateRoleUseCase
 * - UpdateRoleUseCase
 * - seed.js
 */

export const ROLE_PERMISSION_RULES = {

  // ═════════════════════════════════════════════════════════════════
  // GESTIÓN DE USUARIOS Y ROLES (CRUD Completo)
  // ═════════════════════════════════════════════════════════════════

  Usuarios: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ACTIVATE_DEACTIVATE",
    "EXPORT"
  ],

  Roles: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ACTIVATE_DEACTIVATE"
  ],

  // ═════════════════════════════════════════════════════════════════
  // GESTIÓN DE ENTIDADES (CRUD Completo)
  // ═════════════════════════════════════════════════════════════════

  Clientes: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ACTIVATE_DEACTIVATE"
  ],

  Proveedores: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ACTIVATE_DEACTIVATE"
  ],

  // ═════════════════════════════════════════════════════════════════
  // GESTIÓN DE INVENTARIO
  // ═════════════════════════════════════════════════════════════════

  Productos: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ACTIVATE_DEACTIVATE",
    "EXPORT"
  ],

  Categorias: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ACTIVATE_DEACTIVATE"
  ],

  Producto_no_conforme: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "EXPORT",
    "ANULAR"
  ],

  // ═════════════════════════════════════════════════════════════════
  // OPERACIONES DE COMPRA
  // ═════════════════════════════════════════════════════════════════

  Compras: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "ANULAR",
    "DEVOLVER",
    "EXPORT",
    "CREAR_DEVOLUCION"
  ],

  Devoluciones_en_compras: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "ANULAR",
    "EXPORT"
  ],

  // ═════════════════════════════════════════════════════════════════
  // OPERACIONES DE VENTA
  // ═════════════════════════════════════════════════════════════════

  Pedidos: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "ANULAR",
    "EXPORT"
  ],

  Ventas: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "ANULAR",
    "EXPORT",
    "CREAR_DEVOLUCION"
  ],

  // ═════════════════════════════════════════════════════════════════
  // DEVOLUCIONES EN VENTAS
  // ═════════════════════════════════════════════════════════════════

  Devoluciones_en_ventas: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "ANULAR",
    "EXPORT"
  ],

  // ═════════════════════════════════════════════════════════════════
  // FINANZAS
  // ═════════════════════════════════════════════════════════════════

  Pagos_y_abonos: [
    "READ",
    "READ_DETAIL",
    "ABONAR",
    "GENERAR_INTERES",
    "CONTACTAR",
    "EXPORT",
    "DESCARGAR",
    "ANULAR"
  ],

  // ═════════════════════════════════════════════════════════════════
  // CONTENIDO
  // ═════════════════════════════════════════════════════════════════

  Banners: [
    "READ",
    "DELETE",
    "ORDENAR",
    "SUBIR_IMAGEN",
    "ACTIVATE_DEACTIVATE",
    "AMPLIAR_IMAGEN"
  ],

  // ═════════════════════════════════════════════════════════════════
  // REPORTES Y DASHBOARD
  // ═════════════════════════════════════════════════════════════════

  Dashboard: [
    "READ"
  ]

};

export default ROLE_PERMISSION_RULES;

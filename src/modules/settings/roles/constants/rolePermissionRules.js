/**
 * ROLE PERMISSION RULES
 *
 * Define qué privilegios son válidos
 * para cada módulo.
 *
 * Se reutiliza en:
 * - CreateRoleUseCase
 * - UpdateRoleUseCase
 * - seed.js
 */

export const ROLE_PERMISSION_RULES = {

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

  Clientes: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ACTIVATE_DEACTIVATE",
    "EXPORT"
  ],

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
    "DELETE"
  ],

  Proveedores: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ACTIVATE_DEACTIVATE",
    "CONTACTAR"
  ],

  Compras: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "ANULAR",
    "DEVOLVER",
    "EXPORT"
  ],

  Producto_no_conforme: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE"
  ],

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
    "EXPORT"
  ],

  Devoluciones_en_ventas: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "ANULAR",
    "CREAR_DEVOLUCION"
  ],

  Pagos_y_abonos: [
    "READ",
    "READ_DETAIL",
    "ABONAR",
    "GENERAR_INTERES",
    "CONTACTAR",
    "EXPORT"
  ],

  Banners: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "DELETE",
    "ORDENAR",
    "SUBIR_IMAGEN"
  ],

  Devoluciones_en_compras: [
    "CREATE",
    "READ",
    "READ_DETAIL",
    "UPDATE",
    "ANULAR",
    "DEVOLVER"
  ],

  Dashboard: [
    "READ",
    "EXPORT"
  ]

};
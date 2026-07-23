# Sistema de notificaciones

## Resumen

Se implemento un modulo independiente de notificaciones para backend y frontend.

En backend, todos los modulos deben crear notificaciones usando el servicio reutilizable:

```js
import { notificationService } from "../notifications/services/index.js";
```

Ningun modulo debe crear registros directamente con Prisma en la tabla `notifications`.

## Campos principales

```js
await notificationService.create({
  idUser,
  title,
  message,
  type,
  actionUrl,
  metadata,
});
```

- `idUser`: usuario que recibira la notificacion.
- `title`: titulo corto.
- `message`: descripcion visible.
- `type`: tipo de notificacion.
- `actionUrl`: ruta opcional del frontend.
- `metadata`: datos internos opcionales para trazabilidad.

## Tipos soportados

```js
"info"
"success"
"warning"
"error"
"sale"
"purchase"
"payment"
"stock"
"credit"
"order"
"user"
"role"
"system"
"security"
```

## Ejemplo: abono a una deuda

Si una persona hizo un abono a una deuda, normalmente se notifica al cliente dueno de la deuda.

```js
await notificationService.create({
  idUser: cliente.id_user,
  title: "Abono registrado",
  message: `Se registro un abono de $${installment.installment_amount} a tu deuda.`,
  type: "payment",
  actionUrl: "/orders",
  metadata: {
    module: "payments",
    idCredit: credit.id_credit,
    idInstallment: installment.id_installment,
    event: "installment_created",
  },
});
```

Si tambien se necesita avisar al vendedor o administrador encargado:

```js
await notificationService.create({
  idUser: vendedor.id_user,
  title: "Nuevo abono a credito",
  message: `${cliente.users.full_name} realizo un abono de $${installment.installment_amount}.`,
  type: "payment",
  actionUrl: `/admin/sales/payments-and-credits/${credit.id_credit}`,
  metadata: {
    module: "payments",
    idCredit: credit.id_credit,
    idInstallment: installment.id_installment,
    event: "installment_created",
  },
});
```

## Regla para el equipo

1. Identificar quien debe recibir la notificacion.
2. Usar el `type` correspondiente al modulo.
3. Escribir un titulo corto y un mensaje claro.
4. Agregar `actionUrl` cuando la notificacion deba llevar a una pantalla.
5. Guardar IDs y contexto tecnico en `metadata`.

## Verificaciones realizadas

- `npx.cmd prisma validate`: correcto.
- Import de `src/app.js`: correcto.
- Import de `notificationService`: correcto.
- Build del frontend: correcto.

## Pendiente operativo

`npm.cmd run prisma:generate` fallo por bloqueo de Windows sobre `query_engine-windows.dll.node`.
Conviene cerrar procesos Node/backend abiertos y volver a ejecutar:

```bash
npm.cmd run prisma:generate
```


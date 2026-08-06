# Contrato de respuestas de la API de Usuarios

## Objetivo

Definir un contrato estandar para las respuestas del modulo de usuarios antes de refactorizar sus endpoints.

Este documento aplica a:

- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

## Principios

1. Todas las respuestas del modulo deben incluir `success`.
2. Todas las respuestas deben incluir `message`.
3. Las respuestas exitosas deben usar `data`.
4. Las respuestas de error controlado deben usar `errorCode`.
5. Los errores de validacion por campo deben usar `errors`.
6. Nunca se debe exponer al cliente `error.message` tecnico de Prisma, SQL, Zod crudo o stack trace.
7. Los detalles tecnicos deben quedar solo en logs del backend.

## Estructura base

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Operacion completada exitosamente.",
  "data": {},
  "meta": null
}
```

### Respuesta de error controlado

```json
{
  "success": false,
  "message": "No se pudo completar la operacion.",
  "errorCode": "BUSINESS_RULE_VIOLATION",
  "errors": null
}
```

### Respuesta de error de validacion

```json
{
  "success": false,
  "message": "Errores de validacion.",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "email": "El email debe ser valido"
  }
}
```

## Significado de cada campo

- `success`: indica si la operacion fue exitosa o no.
- `message`: texto legible para frontend y apropiado para interfaz de usuario.
- `data`: carga util de la operacion cuando `success` es `true`.
- `meta`: informacion adicional opcional, por ejemplo paginacion.
- `errorCode`: identificador estable para que frontend pueda reaccionar sin depender del texto.
- `errors`: mapa de errores de validacion por campo.

## Reglas por tipo de respuesta

### Exito

- Debe incluir `success: true`.
- Debe incluir `message`.
- Debe incluir `data`.
- Puede incluir `meta`.
- No debe incluir `errorCode`.
- No debe incluir `errors`.

### Error controlado

- Debe incluir `success: false`.
- Debe incluir `message`.
- Debe incluir `errorCode`.
- Puede incluir `errors` solo si hay validaciones por campo.
- No debe incluir `data`.

### Error inesperado

- Debe incluir `success: false`.
- Debe incluir `message` generico y seguro.
- Debe incluir `errorCode: "INTERNAL_SERVER_ERROR"`.
- No debe incluir detalles internos.

Ejemplo:

```json
{
  "success": false,
  "message": "Ocurrio un error interno. Intenta de nuevo.",
  "errorCode": "INTERNAL_SERVER_ERROR",
  "errors": null
}
```

## Uso de HTTP status

- `200`: consulta o actualizacion exitosa.
- `201`: creacion exitosa.
- `400`: request invalido o error de validacion.
- `401`: no autenticado.
- `403`: accion prohibida.
- `404`: recurso no encontrado.
- `409`: conflicto de negocio o integridad.
- `500`: error interno no controlado.

## Convencion inicial para Usuarios

Mientras se migra el modulo, las respuestas nuevas o refactorizadas deben acercarse a este formato:

### Exito simple

```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente.",
  "data": {
    "deletedIdUser": 25
  },
  "meta": null
}
```

### Error de negocio

```json
{
  "success": false,
  "message": "No se puede eliminar el usuario porque tiene clientes asociados.",
  "errorCode": "USER_HAS_ASSOCIATED_CLIENTS",
  "errors": null
}
```

### Error de validacion

```json
{
  "success": false,
  "message": "Errores de validacion.",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "idStatus": "El ID del estado debe ser positivo"
  }
}
```

## Catalogo inicial de `errorCode` para Usuarios

Este catalogo prioriza los endpoints de creacion, actualizacion, cambio de estado y eliminacion.

La regla es simple:

- reutilizar los codigos ya existentes cuando sean validos;
- introducir codigos nuevos solo cuando aclaren mejor una regla de negocio;
- mantener nombres estables para que frontend pueda usarlos sin depender del texto.

### Codigos transversales

- `VALIDATION_ERROR`: datos invalidos o request mal formado.
- `INTERNAL_SERVER_ERROR`: error inesperado no controlado.
- `DATABASE_ERROR`: error de persistencia controlado pero no clasificado aun.
- `USER_NOT_FOUND`: el usuario solicitado no existe.

### Creacion de usuario

- `DUPLICATE_EMAIL`: el correo ya esta registrado por otro usuario.
- `INVALID_ROLE`: se envio un rol invalido al crear.
- `ROLE_NOT_FOUND`: el rol solicitado no existe.

### Actualizacion de usuario

- `NO_DATA_TO_UPDATE`: no se enviaron cambios.
- `SELF_USER_UPDATE_NOT_ALLOWED`: el usuario autenticado intento editarse desde este modulo.
- `CANNOT_UPDATE_SYSTEM_USER`: no se permite actualizar el usuario del sistema.
- `ROLE_UPDATE_ERROR`: fallo el proceso tecnico de reasignacion o eliminacion de rol.

### Cambio de estado

- `SELF_USER_STATUS_UPDATE_NOT_ALLOWED`: el usuario autenticado intento cambiar su propio estado.
- `CANNOT_UPDATE_SYSTEM_USER`: no se permite cambiar el estado del usuario del sistema.
- `STATUS_ALREADY_ASSIGNED`: el usuario ya tiene el estado solicitado.
- `INVALID_STATUS`: el estado solicitado no es valido.

### Eliminacion de usuario

- `SELF_USER_DELETE_NOT_ALLOWED`: el usuario autenticado intento eliminarse a si mismo.
- `CANNOT_DELETE_SYSTEM_USER`: no se permite eliminar el usuario del sistema.
- `USER_STILL_ACTIVE`: el usuario debe estar inactivo antes de eliminarse.
- `USER_HAS_ASSIGNED_ROLES`: el usuario tiene roles asignados y no puede eliminarse.
- `USER_HAS_ASSOCIATED_CLIENTS`: el usuario tiene clientes asociados que impiden su eliminacion.
- `USER_HAS_ASSOCIATED_RECORDS`: el usuario tiene otras relaciones activas que impiden su eliminacion.
- `TRANSFER_ERROR`: fallo una transferencia o desvinculacion previa a la eliminacion.

## Mapa inicial por endpoint

### `POST /api/users`

- `VALIDATION_ERROR`
- `DUPLICATE_EMAIL`
- `INVALID_ROLE`
- `ROLE_NOT_FOUND`
- `DATABASE_ERROR`
- `INTERNAL_SERVER_ERROR`

### `GET /api/users`

- `VALIDATION_ERROR`
- `DATABASE_ERROR`
- `INTERNAL_SERVER_ERROR`

### `GET /api/users/:id`

- `VALIDATION_ERROR`
- `USER_NOT_FOUND`
- `DATABASE_ERROR`
- `INTERNAL_SERVER_ERROR`

### `PUT /api/users/:id`

- `VALIDATION_ERROR`
- `NO_DATA_TO_UPDATE`
- `USER_NOT_FOUND`
- `DUPLICATE_EMAIL`
- `SELF_USER_UPDATE_NOT_ALLOWED`
- `CANNOT_UPDATE_SYSTEM_USER`
- `ROLE_NOT_FOUND`
- `ROLE_UPDATE_ERROR`
- `DATABASE_ERROR`
- `INTERNAL_SERVER_ERROR`

### `PATCH /api/users/:id/status`

- `VALIDATION_ERROR`
- `USER_NOT_FOUND`
- `SELF_USER_STATUS_UPDATE_NOT_ALLOWED`
- `CANNOT_UPDATE_SYSTEM_USER`
- `STATUS_ALREADY_ASSIGNED`
- `INVALID_STATUS`
- `DATABASE_ERROR`
- `INTERNAL_SERVER_ERROR`

### `DELETE /api/users/:id`

- `VALIDATION_ERROR`
- `USER_NOT_FOUND`
- `SELF_USER_DELETE_NOT_ALLOWED`
- `CANNOT_DELETE_SYSTEM_USER`
- `USER_STILL_ACTIVE`
- `USER_HAS_ASSIGNED_ROLES`
- `USER_HAS_ASSOCIATED_CLIENTS`
- `USER_HAS_ASSOCIATED_RECORDS`
- `TRANSFER_ERROR`
- `DATABASE_ERROR`
- `INTERNAL_SERVER_ERROR`

### `GET /api/users/metrics`

- `DATABASE_ERROR`
- `INTERNAL_SERVER_ERROR`

## Codigos vigentes vs. codigos objetivo

Hoy ya existen en el modulo:

- `VALIDATION_ERROR`
- `USER_NOT_FOUND`
- `DUPLICATE_EMAIL`
- `INVALID_ROLE`
- `NO_DATA_TO_UPDATE`
- `SELF_USER_UPDATE_NOT_ALLOWED`
- `SELF_USER_STATUS_UPDATE_NOT_ALLOWED`
- `SELF_USER_DELETE_NOT_ALLOWED`
- `CANNOT_UPDATE_SYSTEM_USER`
- `CANNOT_DELETE_SYSTEM_USER`
- `USER_STILL_ACTIVE`
- `USER_HAS_ASSIGNED_ROLES`
- `ROLE_NOT_FOUND`
- `ROLE_UPDATE_ERROR`
- `TRANSFER_ERROR`
- `DATABASE_ERROR`

Se proponen como codigos objetivo adicionales para mejorar claridad:

- `INTERNAL_SERVER_ERROR`
- `STATUS_ALREADY_ASSIGNED`
- `INVALID_STATUS`
- `USER_HAS_ASSOCIATED_CLIENTS`
- `USER_HAS_ASSOCIATED_RECORDS`

Estos codigos nuevos no tienen que implementarse todos de inmediato. Pueden incorporarse por endpoint a medida que se refactorice el modulo.

## Politica de mensajes publicos vs. logs internos

El modulo de usuarios debe separar con claridad:

- el mensaje que puede ver frontend;
- el detalle tecnico que solo debe quedar en logs.

### Regla general

- El cliente solo debe recibir mensajes de negocio, validacion o estado de operacion.
- Los logs internos si pueden guardar detalles tecnicos como:
  - `error.message`
  - `error.stack`
  - codigos Prisma como `P2002`, `P2003`, `P2025`
  - nombres de tablas, columnas, constraints o relaciones
  - payload tecnico o contexto adicional de depuracion

### Nunca exponer al frontend

- mensajes crudos de Prisma;
- mensajes construidos con `${error.message}` en respuestas HTTP;
- nombres de tablas como `users`, `clients`, `employee_roles`, `access`;
- nombres de constraints o foreign keys;
- stacks, rutas internas o errores de librerias.

### Si exponer al frontend

- mensajes de validacion;
- mensajes de negocio;
- mensajes de permiso o restriccion de accion;
- mensajes genericos de error interno cuando no exista clasificacion segura.

## Mapa inicial de mensajes publicos por `errorCode`

Este mapa define el texto objetivo que puede exponerse en frontend.

### Codigos transversales

- `VALIDATION_ERROR` -> `Errores de validacion.`
- `INTERNAL_SERVER_ERROR` -> `Ocurrio un error interno. Intenta de nuevo.`
- `DATABASE_ERROR` -> `No se pudo completar la operacion. Intenta de nuevo.`
- `USER_NOT_FOUND` -> `Usuario no encontrado.`

### Creacion de usuario

- `DUPLICATE_EMAIL` -> `El email ya esta registrado.`
- `INVALID_ROLE` -> `El rol seleccionado no es valido.`
- `ROLE_NOT_FOUND` -> `El rol seleccionado no existe.`

### Actualizacion de usuario

- `NO_DATA_TO_UPDATE` -> `Debe proporcionar al menos un campo para actualizar.`
- `SELF_USER_UPDATE_NOT_ALLOWED` -> `No puedes editar tu propio usuario desde este modulo. Usa la seccion de perfil.`
- `CANNOT_UPDATE_SYSTEM_USER` -> `No se puede actualizar el usuario del sistema.`
- `ROLE_UPDATE_ERROR` -> `No se pudo actualizar el rol del usuario.`

### Cambio de estado

- `SELF_USER_STATUS_UPDATE_NOT_ALLOWED` -> `No puedes activar o desactivar tu propio usuario.`
- `STATUS_ALREADY_ASSIGNED` -> `El usuario ya cuenta con ese estado.`
- `INVALID_STATUS` -> `El estado solicitado no es valido.`

### Eliminacion de usuario

- `SELF_USER_DELETE_NOT_ALLOWED` -> `No puedes eliminar tu propio usuario.`
- `CANNOT_DELETE_SYSTEM_USER` -> `No se puede eliminar el usuario del sistema.`
- `USER_STILL_ACTIVE` -> `El usuario debe estar inactivo para poder ser eliminado.`
- `USER_HAS_ASSIGNED_ROLES` -> `No se puede eliminar el usuario porque tiene roles asignados.`
- `USER_HAS_ASSOCIATED_CLIENTS` -> `No se puede eliminar el usuario porque tiene clientes asociados.`
- `USER_HAS_ASSOCIATED_RECORDS` -> `No se puede eliminar el usuario porque tiene relaciones activas en el sistema.`
- `TRANSFER_ERROR` -> `No se pudo completar la eliminacion del usuario por una restriccion de integridad.`

## Plantilla sugerida para logs internos

Cuando ocurra un error tecnico, el backend debe registrar algo de este estilo:

```js
console.error("[DeleteUserUseCase]", {
  errorCode: "TRANSFER_ERROR",
  message: error.message,
  stack: error.stack,
  prismaCode: error.code,
  meta: error.meta,
  idUser,
});
```

La respuesta HTTP correspondiente no debe reutilizar ese texto tecnico.

## Alcance practico de esta tarea

Desde este punto del plan, cualquier cambio nuevo en usuarios debe tomar una decision explicita:

- `publicMessage`: texto seguro para frontend.
- `logMessage`: detalle tecnico para backend.

Aunque aun no se haya refactorizado todo el modulo, ya queda definido que ambos no deben volver a mezclarse.

## Convencion unica de error controlado

El backend debe usar una sola clase `AppError` oficial:

- archivo canonico: `src/shared/errors/appError.js`
- `src/shared/middlewares/appError.js` queda solo como alias de compatibilidad temporal

### Firma objetivo

```js
new AppError(message, statusCode, {
  errorCode,
  publicMessage,
  errors,
  details,
})
```

### Significado

- `message`: detalle interno del error, util para debugging y logs.
- `statusCode`: codigo HTTP que debe responder el backend.
- `errorCode`: identificador estable para frontend.
- `publicMessage`: mensaje seguro para respuesta HTTP.
- `errors`: errores por campo cuando aplique.
- `details`: contexto opcional para uso interno.

### Regla de adopcion

- Los errores controlados nuevos deben construirse con `AppError`.
- El middleware global debe leer `publicMessage` y `errorCode`.
- Los controllers y use cases no deben crear nuevas variantes paralelas de error controlado.

### Ejemplo sugerido

```js
throw new AppError(
  "Prisma foreign key constraint failed on clients.id_user",
  409,
  {
    errorCode: "USER_HAS_ASSOCIATED_CLIENTS",
    publicMessage:
      "No se puede eliminar el usuario porque tiene clientes asociados.",
  }
);
```

En este ejemplo:

- el detalle tecnico queda en `message` para logs;
- el cliente solo recibe `publicMessage` y `errorCode`.

## Helpers reutilizables de respuesta

Para evitar que cada controller construya JSON manualmente, el backend debe apoyarse en helpers compartidos.

Archivo base:

- `src/shared/utils/httpResponses.js`

Helpers iniciales:

- `sendSuccess(res, { status, message, data, meta })`
- `sendError(res, { status, message, errorCode, errors })`
- `sendValidationError(res, errors, { status, message, errorCode })`
- `sendInternalError(res, { status, message, errorCode })`

### Objetivo de estos helpers

- reducir diferencias entre controllers;
- reutilizar el contrato estandar ya definido;
- evitar respuestas incompletas o con claves inconsistentes;
- facilitar la migracion gradual del modulo de usuarios.

## Alcance de esta tarea

Esta tarea define el contrato, el catalogo inicial de `errorCode`, la politica de mensajes publicos del modulo y la convencion unica del error controlado.

No cambia todavia:

- controllers
- use cases
- compatibilidad del frontend

Eso se aplicara en las siguientes tareas del plan.

## Estado actual de implementacion

Al cierre de la tarea 15, el modulo de usuarios ya aplica este contrato en todos sus endpoints principales:

- `POST /api/users`
- `GET /api/users`
- `GET /api/users/metrics`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

### Resumen de comportamiento actual

- todos los controllers del modulo responden con `success` y `message`;
- los errores controlados usan `errorCode`;
- las validaciones por campo usan `errors`;
- los errores tecnicos quedan solo en logs internos;
- el frontend puede seguir usando `response.data.data`;
- `GET /api/users` mantiene `pagination` en el nivel superior por compatibilidad y tambien la expone en `meta.pagination`.

## Ejemplos reales esperados

### `GET /api/users`

```json
{
  "success": true,
  "message": "Usuarios recuperados exitosamente.",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### `GET /api/users/:id`

```json
{
  "success": true,
  "message": "Usuario obtenido exitosamente.",
  "data": {
    "user": {},
    "role": null,
    "permissions": [],
    "client": null,
    "requiresPasswordSetup": false
  }
}
```

### `GET /api/users/metrics`

```json
{
  "success": true,
  "message": "Metricas de usuarios obtenidas exitosamente.",
  "data": {
    "totalUsers": 0,
    "activeUsers": 0,
    "inactiveUsers": 0
  }
}
```

## Siguiente paso recomendado

Con el backend ya normalizado, el siguiente bloque de trabajo natural es revisar el frontend de usuarios y su sistema de alertas para que:

- priorice `errorCode` cuando necesite decisiones de interfaz;
- use `message` como texto amigable por defecto;
- deje de depender de comparaciones con mensajes literales cuando ya exista un codigo estable.

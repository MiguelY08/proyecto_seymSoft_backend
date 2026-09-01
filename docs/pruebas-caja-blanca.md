# Informe de pruebas de caja blanca

## Proyecto

Backend de SeymSoft, desarrollado con Node.js, Express y Prisma.

## Objetivo

Validar la logica interna de los modulos criticos del sistema mediante pruebas automatizadas de caja blanca. El enfoque principal es revisar reglas de negocio, validaciones, manejo de errores, cambios de estado y operaciones que afectan dinero, stock o permisos.

## Herramienta seleccionada

Se utiliza `node --test`, el runner nativo de Node.js, junto con `node:assert/strict`.

Esta herramienta es recomendable para este proyecto porque:

- Ya esta configurada en `package.json` con el comando `npm.cmd test`.
- No requiere instalar una herramienta adicional.
- Permite probar use-cases, helpers, validators y repositorios simulados.
- Es suficiente para pruebas unitarias y pruebas de contrato de la logica interna.

## Tipo de pruebas

Las pruebas planteadas son automatizadas. Esto significa que se pueden ejecutar repetidamente con un comando y el sistema informa si los casos pasan o fallan.

Comando de ejecucion:

```bash
npm.cmd test
```

## Modulos priorizados

1. Acceso y autenticacion
2. Ventas, pedidos, pagos y creditos
3. Productos e inventario
4. Compras
5. Devoluciones en compras

## Estrategia

La estrategia inicial es probar primero los `use-cases` y helpers porque contienen la logica de negocio. Para evitar depender de una base de datos real en cada prueba, se usan repositorios simulados cuando el caso lo permite.

Despues de cubrir la logica principal, se pueden agregar pruebas de integracion para endpoints criticos.

## Avance

### Estado inicial

Antes de agregar nuevas pruebas, el proyecto tenia pruebas automatizadas en:

- `tests/auth`
- `tests/sales`
- `tests/settings`
- `tests/productCommercialStatus.test.js`
- `tests/supplierPurchaseStockAnnulment.test.js`

Resultado observado:

- 42 pruebas detectadas
- 39 aprobadas
- 0 fallidas
- 3 marcadas como TODO

### Modulo: acceso y autenticacion

Casos existentes:

- Validacion de JWT refresh token expirado.
- Validacion de JWT refresh token invalido.
- Generacion correcta de refresh token.
- Validaciones de registro.
- Proteccion contra campos inesperados.
- Proteccion contra correos duplicados.
- Rate limit en registro.

Casos agregados en esta etapa:

- Login rechaza usuario inexistente.
- Login rechaza usuario inactivo.
- Login rechaza contrasena incorrecta.
- Login exitoso devuelve usuario, rol, permisos, access token y refresh token.
- Login exitoso persiste el refresh token.

Archivo creado:

- `tests/auth/loginUseCase.test.js`

Resultado despues de agregar las pruebas de login:

- 46 pruebas detectadas
- 43 aprobadas
- 0 fallidas
- 3 marcadas como TODO

Conclusion parcial:

El modulo de acceso/autenticacion queda mejor cubierto porque ahora se validan ramas internas del inicio de sesion: busqueda de usuario, validacion de estado, comparacion de contrasena, generacion de tokens y persistencia del refresh token.

## Proximos pasos

El siguiente modulo recomendado es el submodulo ventas, ubicado en `src/modules/sales/vendings`, porque gestiona la creacion, actualizacion, anulacion y transformacion de datos de ventas.

### Submodulo: ventas

Objetivo de la etapa:

Validar reglas internas del submodulo `vendings`: tipos de venta permitidos, metodos de pago, credito, entrega a domicilio, actualizacion, anulacion y mapeo de datos de venta hacia la respuesta de la API.

Archivo creado:

- `tests/sales/vendingsBusinessRules.test.js`

Casos agregados:

- Validacion de parametros para tipos de venta permitidos: `manual`, `direct` y `web`.
- Rechazo de tipos de venta desconocidos.
- Rechazo de metodos de pago repetidos en una misma venta.
- Exigencia de datos de credito cuando el metodo de pago es Credito.
- Rechazo de datos de credito cuando la venta no usa metodo de pago Credito.
- Exigencia de direccion, ubicacion y valor de envio cuando la venta es a domicilio.
- Rechazo de actualizaciones vacias.
- Exigencia de direccion cuando se actualiza una venta a domicilio.
- Validacion de anulacion con id positivo y motivo obligatorio.
- Conversion de id recibido como texto a numero en parametros de actualizacion.
- Mapeo de datos de venta, pedido, cliente, pago, estado y tipo de venta en `VendingMapper.toResponse`.

Hallazgo tecnico durante la prueba:

El validador de creacion devuelve errores con rutas anidadas, por ejemplo `order.deliveryAddress`. La prueba se ajusto para validar el contrato real del submodulo.

Resultado despues de corregir el enfoque hacia el submodulo ventas:

- 56 pruebas detectadas
- 53 aprobadas
- 0 fallidas
- 3 marcadas como TODO

Conclusion parcial:

El submodulo ventas queda cubierto en sus reglas de validacion y transformacion de datos. Estas pruebas son de caja blanca porque se disenan con conocimiento del codigo interno: schemas de Zod, validaciones condicionales, rutas de error anidadas y estructura del mapper de ventas.

Siguiente modulo recomendado:

Productos e inventario, porque conecta ventas y compras mediante disponibilidad, codigos de barras, precios y estados comerciales.

### Modulo: productos e inventario

Objetivo de la etapa:

Validar reglas internas del modulo de productos relacionadas con creacion, actualizacion, eliminacion, referencias, codigos de barras, estados comerciales y calculo de stock total.

Casos existentes:

- Producto creado sin todos los precios de venta queda inactivo.
- Producto con todos los precios positivos puede quedar activo.
- El precio de proveedor no es obligatorio para publicacion comercial.
- Identificacion de precios faltantes.
- Producto incompleto no puede activarse manualmente.
- Validacion de longitud maxima de referencia.
- Validacion de longitud de codigos de barras.

Archivo creado:

- `tests/products/productUseCases.test.js`

Casos agregados:

- `CreateProductUseCase` rechaza una unidad de medida inexistente antes de crear.
- `CreateProductUseCase` rechaza una referencia duplicada.
- `CreateProductUseCase` rechaza un codigo de barras duplicado.
- `CreateProductUseCase` crea un producto valido y devuelve la respuesta mapeada.
- `UpdateProductUseCase` rechaza actualizar un producto inexistente.
- `UpdateProductUseCase` valida codigos de barras duplicados excluyendo el producto actual.
- `DeleteProductUseCase` no elimina cuando el producto no existe.
- `mapProduct` calcula el stock total sumando todos los codigos de barras del producto.

Resultado despues de agregar las pruebas de productos e inventario:

- 64 pruebas detectadas
- 61 aprobadas
- 0 fallidas
- 3 marcadas como TODO

Conclusion parcial:

El modulo de productos e inventario queda mejor cubierto porque se prueban reglas antes de persistir datos, validaciones contra duplicados y transformacion de datos hacia la respuesta. Estas pruebas son de caja blanca porque conocen el orden interno del use-case: primero valida catalogos, luego duplicados, despues crea/actualiza/elimina y finalmente mapea la respuesta.

Siguiente modulo recomendado:

Compras, porque impacta el aumento de stock, la relacion con proveedores y el registro de detalles de compra.

### Modulo: compras

Objetivo de la etapa:

Validar reglas internas del submodulo de compras a proveedores, ubicado en `src/modules/purchases/supplierPurchases`. Este modulo es critico porque registra facturas, proveedores, productos comprados, precios, impuestos, stock agregado y fechas maximas para devolucion.

Archivo creado:

- `tests/purchases/supplierPurchasesUseCase.test.js`

Casos agregados:

- `CreateSupplierPurchaseDto` normaliza numero de factura, fecha, proveedor, cantidades, precio y codigos de barras extra.
- `createSupplierPurchaseValidator` rechaza facturas con caracteres invalidos.
- `createSupplierPurchaseValidator` rechaza fechas futuras.
- `CreateSupplierPurchaseUseCase` rechaza factura duplicada antes de consultar proveedor.
- `CreateSupplierPurchaseUseCase` rechaza proveedor inexistente.
- `CreateSupplierPurchaseUseCase` rechaza producto sin codigo de barras.
- `CreateSupplierPurchaseUseCase` calcula fecha maxima de devolucion segun el plazo del proveedor.
- `CreateSupplierPurchaseUseCase` calcula stock agregado cuando la compra es por paca.
- `CreateSupplierPurchaseUseCase` calcula subtotal bruto, IVA y subtotal neto.
- `SupplierPurchaseMapper.detailToDTO` limita la cantidad retornable al stock disponible.
- `SupplierPurchaseMapper.detailToDTO` separa codigos de barras extra del codigo principal.

Hallazgos tecnicos durante la prueba:

- El use-case de compras valida primero la factura duplicada. Si la factura ya existe, no consulta proveedor ni continua con el flujo.
- El camino exitoso intenta notificar administradores despues de crear la compra. Para mantener la prueba aislada, se simulo `prisma.users.findMany` y asi no se conecta a la base de datos real.
- La fecha de compra se construyo como objeto `Date` local en la prueba de calculo de fecha maxima para evitar diferencias por zona horaria.

Resultado despues de agregar las pruebas de compras:

- 71 pruebas detectadas
- 68 aprobadas
- 0 fallidas
- 3 marcadas como TODO

Conclusion parcial:

El modulo de compras queda cubierto en reglas previas a la persistencia y en calculos internos importantes. Estas pruebas son de caja blanca porque validan el orden exacto del use-case, el enriquecimiento de detalles, el calculo de impuestos, el stock agregado por tipo de compra y el contrato del mapper usado para respuestas.

Siguiente modulo recomendado:

Devoluciones en compras, porque depende directamente de las compras registradas y puede afectar estados, stock, auditoria y cantidades disponibles.

### Modulo: devoluciones en compras

Objetivo de la etapa:

Validar reglas internas del modulo de devoluciones en compras, ubicado en `src/modules/purchases/purchase-returns`. Este modulo es critico porque controla si una compra todavia puede recibir devoluciones, cuanto producto se puede devolver, que estados son validos y cuando debe restaurarse stock.

Archivo creado:

- `tests/purchases/purchaseReturnsBusinessRules.test.js`

Casos agregados:

- `validatePurchaseReturnPeriod` permite devoluciones hasta la fecha maxima calculada.
- `validatePurchaseReturnPeriod` rechaza devoluciones fuera del periodo permitido.
- `calculatePurchaseDetailReturnAvailability` descuenta cantidades reservadas y devoluciones finales.
- `calculatePurchaseDetailsReturnAvailability` usa `stock_added` para compras por paca.
- `validateReturnQuantity` rechaza cantidades menores a uno.
- `validateReturnQuantity` rechaza cantidades superiores a la disponibilidad.
- `validateDetailStatusTransition` respeta el flujo permitido segun metodo de devolucion.
- Rechazo de estado `Prov. rechazo` cuando el motivo no esta permitido.
- `shouldRestoreStockOnReady` valida cuando se restaura stock al marcar reemplazo como listo.
- `shouldRestoreStockOnAnnul` valida cuando se restaura stock al anular una devolucion.
- `calculateReturnLifecycle` resume si una devolucion esta en proceso, completada o anulada.
- `calculatePurchaseStatusFromReturns` calcula el siguiente estado de la compra segun sus devoluciones.
- `validateDetailIsEditable` bloquea detalles listos o rechazados por proveedor.
- Validadores de crear, actualizar y anular devoluciones normalizan ids y rechazan datos vacios.
- `PurchaseReturnMapper.toDetailResponse` incluye progreso, compra, detalles y auditoria.

Resultado despues de agregar las pruebas de devoluciones en compras:

- 82 pruebas detectadas
- 79 aprobadas
- 0 fallidas
- 3 marcadas como TODO

Conclusion parcial:

El modulo de devoluciones en compras queda cubierto en sus reglas internas mas importantes: periodo permitido, cantidades disponibles, flujo de estados, restauracion de stock, calculo del estado general y mapeo de respuesta. Estas pruebas son de caja blanca porque se construyeron revisando directamente los helpers, validadores y mappers internos del modulo.

## Resultado acumulado

Despues de trabajar los modulos seleccionados, la suite automatizada queda asi:

- 82 pruebas detectadas
- 79 aprobadas
- 0 fallidas
- 3 marcadas como TODO

Archivos agregados durante este trabajo:

- `tests/auth/loginUseCase.test.js`
- `tests/sales/vendingsBusinessRules.test.js`
- `tests/products/productUseCases.test.js`
- `tests/purchases/supplierPurchasesUseCase.test.js`
- `tests/purchases/purchaseReturnsBusinessRules.test.js`

## Conclusion general

Las pruebas realizadas son automatizadas y de caja blanca, porque se disenaron con conocimiento de la estructura interna del backend: DTOs, validators, helpers, use-cases, repositories simulados y mappers. La herramienta usada fue `node --test`, ejecutada con `npm.cmd test`.

El principal beneficio para el proyecto es que ahora varias reglas criticas pueden validarse de forma repetible: acceso, ventas, productos, compras y devoluciones en compras. Esto reduce el riesgo de errores en dinero, stock, estados y permisos cuando se hagan cambios futuros.

## Pruebas TODO pendientes

Durante la ejecucion final aparecen 3 pruebas marcadas como TODO. Estas pruebas no son errores ni fallos de la suite. En `node --test`, un `test.todo(...)` representa un caso identificado como importante, pero que todavia no esta implementado.

Las pruebas TODO se encuentran en:

- `tests/sales/orderPaymentAtomicity.test.js`

Casos pendientes:

- Aprobar comprobante revierte pago o venta si no puede aprobar el comprobante.
- Rechazar comprobante revierte el nuevo plazo si no puede rechazar el comprobante.
- Venta directa revierte pedido, saldo a favor, venta, credito y stock ante cualquier fallo.

Explicacion de cada caso:

1. Aprobar comprobante revierte pago o venta si falla algo.

   Cuando un cliente sube un comprobante de pago y el administrador lo aprueba, el sistema puede registrar un pago, cambiar el estado del pedido y generar una venta. La prueba pendiente busca validar que, si algo falla durante ese proceso, el sistema no deje datos incompletos; por ejemplo, un comprobante aprobado pero una venta no creada.

2. Rechazar comprobante revierte el nuevo plazo si falla algo.

   Cuando se rechaza un comprobante, el sistema puede cambiar el estado del comprobante y actualizar el plazo o fecha limite de pago. La prueba pendiente busca asegurar que, si falla el rechazo, no quede modificado incorrectamente el plazo de pago.

3. Venta directa revierte todo si ocurre un fallo.

   Una venta directa puede afectar pedido, saldo a favor, venta, credito y stock. La prueba pendiente busca validar atomicidad: si algo falla, nada debe quedar parcialmente guardado. Por ejemplo, no deberia descontarse stock si la venta no quedo registrada correctamente.

Interpretacion para la exposicion:

Los 3 TODO representan escenarios transaccionales complejos pendientes de automatizar. No son fallos actuales, sino casos futuros propuestos para reforzar la validacion de atomicidad en procesos criticos de ventas y pagos.
